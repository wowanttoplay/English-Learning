export function formatTopic(topic: string): string {
  if (!topic) return ''
  return topic.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase())
}
