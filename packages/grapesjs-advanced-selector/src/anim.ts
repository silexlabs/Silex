export function animateTextChange(element: HTMLElement, newText: string, speed: number = 10): void {
  if (!element) {
    console.error(`Element not found.`, { element })
    return
  }

  const oldText = element.textContent || ""
  const maxLength = Math.max(oldText.length, newText.length)
  let newHTML = ""

  for (let i = 0; i < maxLength; i++) {
    const oldChar = oldText[i] || ""
    const newChar = newText[i] || ""

    if (oldChar === newChar) {
      // Keep unchanged characters visible
      newHTML += `<span style="opacity: 1; transition: none;">${newChar}</span>`
    } else {
      // Animate changed characters
      newHTML += `<span style="opacity: 0; transition: opacity ${speed}ms;">${newChar}</span>`
    }
  }

  element.innerHTML = newHTML

  // Trigger animation
  setTimeout(() => {
    element.querySelectorAll("span").forEach((span, i) => {
      if (span.style.opacity === "0") {
        setTimeout(() => (span.style.opacity = "1"), i * speed * 0.5)
      }
    })
  }, speed)
}
