/*
 * Silex website builder - desktop app.
 * Copyright (c) 2023 lexoyo and Silex Labs foundation
 *
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU Affero General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or any later version.
 */

//! Images an agent copies from the disk into a website

use std::io::Read;
use std::path::Path;

use quick_xml::events::{BytesStart, Event};
use quick_xml::Reader;

const MAX_BYTES: u64 = 10 * 1024 * 1024;

pub struct Image {
    pub name: String,
    pub mime: &'static str,
    pub content: Vec<u8>,
}

/// The agent chooses the path and what it reads ends up in a published website:
/// only a file that is really an image is read through
pub fn read_image(path: &str) -> Result<Image, String> {
    let path = Path::new(path);
    if !path.is_absolute() {
        return Err(format!(
            "path must be absolute, like /home/me/logo.svg: {}",
            path.display()
        ));
    }
    let extension = path
        .extension()
        .and_then(|e| e.to_str())
        .map(str::to_ascii_lowercase)
        .unwrap_or_default();
    let mime = match extension.as_str() {
        "png" => "image/png",
        "jpg" | "jpeg" => "image/jpeg",
        "gif" => "image/gif",
        "webp" => "image/webp",
        "avif" => "image/avif",
        "svg" => "image/svg+xml",
        _ => return Err("Only images can be imported: png, jpg, gif, webp, avif or svg.".into()),
    };
    let unreadable = |e: std::io::Error| format!("Can not read {}: {e}", path.display());
    // Where a link leads: hidden folders hold keys, caches and thumbnails, not the
    // images of a website
    let target = std::fs::canonicalize(path).map_err(unreadable)?;
    if target
        .components()
        .any(|part| part.as_os_str().to_string_lossy().starts_with('.'))
    {
        return Err(format!("{} is in a hidden folder.", path.display()));
    }
    // Opening a named pipe would wait for a writer forever
    if !std::fs::metadata(&target).map_err(unreadable)?.is_file() {
        return Err(format!("{} is not a file.", path.display()));
    }
    let file = std::fs::File::open(&target).map_err(unreadable)?;
    if !file.metadata().map_err(unreadable)?.is_file() {
        return Err(format!("{} is not a file.", path.display()));
    }
    let mut content = Vec::new();
    file.take(MAX_BYTES + 1)
        .read_to_end(&mut content)
        .map_err(unreadable)?;
    if content.len() as u64 > MAX_BYTES {
        return Err(format!("{} is larger than 10 MB.", path.display()));
    }
    if !is_image(mime, &content) {
        return Err(format!(
            "{} is not a {extension} image{}.",
            path.display(),
            if mime == "image/svg+xml" {
                ", or it has more than drawing elements (a script, a link, an event attribute)"
            } else {
                ""
            }
        ));
    }
    Ok(Image {
        name: safe_name(path, &extension),
        mime,
        content,
    })
}

fn is_image(mime: &str, content: &[u8]) -> bool {
    match mime {
        "image/png" => content.starts_with(b"\x89PNG\r\n\x1a\n"),
        "image/jpeg" => content.starts_with(&[0xFF, 0xD8, 0xFF]),
        "image/gif" => content.starts_with(b"GIF87a") || content.starts_with(b"GIF89a"),
        "image/webp" => {
            content.len() > 12 && &content[..4] == b"RIFF" && &content[8..12] == b"WEBP"
        }
        "image/avif" => {
            content.len() > 12
                && &content[4..8] == b"ftyp"
                && matches!(&content[8..12], b"avif" | b"avis")
        }
        "image/svg+xml" => std::str::from_utf8(content).is_ok_and(is_safe_svg),
        _ => false,
    }
}

const SVG_ELEMENTS: &[&str] = &[
    "svg",
    "g",
    "path",
    "circle",
    "ellipse",
    "line",
    "polyline",
    "polygon",
    "rect",
    "text",
    "tspan",
    "textpath",
    "defs",
    "use",
    "symbol",
    "title",
    "desc",
    "lineargradient",
    "radialgradient",
    "stop",
    "clippath",
    "mask",
    "pattern",
    "filter",
    "marker",
    "image",
    "style",
    "metadata",
    "switch",
    "view",
];

/// Read as XML, the way a browser does, and kept only if made of drawing elements:
/// a list of what to refuse would miss a namespace prefix or a character reference
fn is_safe_svg(text: &str) -> bool {
    let mut reader = Reader::from_str(text);
    let mut root = None;
    loop {
        match reader.read_event() {
            Ok(Event::Start(element)) | Ok(Event::Empty(element)) => {
                let name = element.local_name().as_ref().to_ascii_lowercase();
                let drawing = SVG_ELEMENTS.contains(&name.as_str()) || name.starts_with("fe");
                root.get_or_insert(name);
                if !drawing || !safe_attributes(&element) {
                    return false;
                }
            }
            Ok(Event::DocType(doctype)) => {
                if doctype.as_ref().to_ascii_uppercase().contains("ENTITY") {
                    return false;
                }
            }
            // A stylesheet or XSLT processing instruction loads another file
            Ok(Event::PI(_)) => return false,
            Ok(Event::Eof) => return root.as_deref() == Some("svg"),
            Ok(_) => {}
            Err(_) => return false,
        }
    }
}

fn safe_attributes(element: &BytesStart) -> bool {
    element.attributes().all(|attribute| {
        let Ok(attribute) = attribute else {
            return false;
        };
        let name = attribute.key.local_name().as_ref().to_ascii_lowercase();
        let Ok(value) = attribute.normalized_value(quick_xml::XmlVersion::Implicit1_0) else {
            return false;
        };
        let value: String = value
            .chars()
            .filter(|c| !c.is_whitespace())
            .collect::<String>()
            .to_ascii_lowercase();
        let local_link = value.starts_with('#')
            || (value.starts_with("data:image/") && !value.starts_with("data:image/svg"));
        !name.starts_with("on") && !value.contains("javascript:") && (name != "href" || local_link)
    })
}

fn safe_name(path: &Path, extension: &str) -> String {
    let stem: String = path
        .file_stem()
        .and_then(|s| s.to_str())
        .unwrap_or_default()
        .to_ascii_lowercase()
        .chars()
        .map(|c| {
            if c.is_ascii_alphanumeric() || c == '-' || c == '_' {
                c
            } else {
                '-'
            }
        })
        .collect();
    let stem = stem.trim_matches('-');
    let extension = if extension == "jpeg" {
        "jpg"
    } else {
        extension
    };
    format!(
        "{}.{extension}",
        if stem.is_empty() { "image" } else { stem }
    )
}

#[cfg(test)]
mod tests {
    use super::*;

    fn write(name: &str, content: &[u8]) -> String {
        let dir = std::env::current_dir()
            .unwrap()
            .join("target")
            .join("asset-import-tests");
        std::fs::create_dir_all(&dir).unwrap();
        let path = dir.join(name);
        std::fs::write(&path, content).unwrap();
        path.to_string_lossy().into_owned()
    }

    #[test]
    fn reads_only_images() {
        let png = write("Logo Final.PNG", b"\x89PNG\r\n\x1a\nrest");
        assert_eq!(read_image(&png).unwrap().name, "logo-final.png");
        assert!(read_image(&write(
            "id_ed25519.png",
            b"-----BEGIN OPENSSH PRIVATE KEY-----"
        ))
        .is_err());
        assert!(read_image(&write("notes.txt", b"hello")).is_err());
        assert!(read_image("relative/logo.png").is_err());
        assert!(read_image(&write(".hidden.png", b"\x89PNG\r\n\x1a\nrest")).is_err());
        #[cfg(unix)]
        {
            let link = std::path::Path::new(&png).with_file_name("link-to-hidden.png");
            let _ = std::fs::remove_file(&link);
            std::os::unix::fs::symlink(write(".hidden.png", b"\x89PNG\r\n\x1a\nrest"), &link)
                .unwrap();
            assert!(read_image(&link.to_string_lossy()).is_err());
        }
        let large = [b"\x89PNG\r\n\x1a\n".as_slice(), &vec![0; 10 * 1024 * 1024]].concat();
        assert!(read_image(&write("large.png", &large)).is_err());
    }

    #[test]
    fn refuses_an_svg_that_runs_code() {
        let svg = |name: &str, text: &str| read_image(&write(name, text.as_bytes()));
        assert!(svg(
            "ok.svg",
            "<svg xmlns='http://www.w3.org/2000/svg'><path d='M0 0'/><text>turn on = off</text></svg>"
        )
        .is_ok());
        assert!(svg("script.svg", "<svg><script>alert(1)</script></svg>").is_err());
        assert!(svg("onload.svg", "<svg onload = 'alert(1)'></svg>").is_err());
        assert!(svg(
            "link.svg",
            "<svg><image href='javascript&#58;alert(1)'/></svg>"
        )
        .is_err());
        assert!(svg(
            "prefix.svg",
            "<svg><h:script xmlns:h='http://www.w3.org/1999/xhtml'>alert(1)</h:script></svg>"
        )
        .is_err());
        assert!(svg(
            "xslt.svg",
            "<?xml-stylesheet href='https://example.com/x.xsl' type='text/xsl'?><svg/>"
        )
        .is_err());
        assert!(svg(
            "foreign.svg",
            "<svg><foreignObject><iframe src='https://example.com'/></foreignObject></svg>"
        )
        .is_err());
    }
}
