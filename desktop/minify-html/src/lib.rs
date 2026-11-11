#[derive(Default)]
pub struct Cfg {
    pub keep_html_and_head_opening_tags: bool,
    pub minify_css: bool,
    pub minify_js: bool,
}

impl Cfg {
    pub fn new() -> Self {
        Self::default()
    }
}

pub fn minify(src: &[u8], _cfg: &Cfg) -> Vec<u8> {
    src.to_vec()
}
