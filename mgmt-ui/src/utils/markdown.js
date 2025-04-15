/**
 * Simple Markdown parser for rendering basic Markdown in chat messages
 * This is a lightweight alternative to using external libraries
 */

// Convert markdown to HTML
export function parseMarkdown(text) {
  if (!text) return '';
  
  let html = text;

  // Code blocks (```code```)
  html = html.replace(/```(.+?)```/gs, '<pre><code>$1</code></pre>');
  
  // Inline code (`code`)
  html = html.replace(/`([^`]+)`/g, '<code>$1</code>');
  
  // Headers
  html = html.replace(/^# (.+)$/gm, '<h1>$1</h1>');
  html = html.replace(/^## (.+)$/gm, '<h2>$1</h2>');
  html = html.replace(/^### (.+)$/gm, '<h3>$1</h3>');
  
  // Bold
  html = html.replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>');
  
  // Italic
  html = html.replace(/\*(.+?)\*/g, '<em>$1</em>');
  
  // Lists
  html = html.replace(/^\s*\*\s+(.+)$/gm, '<li>$1</li>');
  html = html.replace(/^\s*\d+\.\s+(.+)$/gm, '<li>$1</li>');
  
  // Replace consecutive list items with a proper list
  html = html.replace(/(<li>.+<\/li>)\s*(<li>.+<\/li>)/gs, '<ul>$1$2</ul>');
  
  // Links
  html = html.replace(/\[(.+?)\]\((.+?)\)/g, '<a href="$2" target="_blank">$1</a>');
  
  // Paragraphs - Replace newlines with <br> for line breaks
  html = html.replace(/\n/g, '<br>');
  
  return html;
}
