import type { Domain, Subtopic, DomainId, SubtopicId } from '@/types'

export const DOMAINS: readonly Domain[] = [
  { id: 'life', name: 'Life & Daily', emoji: '🏠' },
  { id: 'work', name: 'Work & Career', emoji: '💼' },
  { id: 'society', name: 'Society & World', emoji: '🌍' },
  { id: 'people', name: 'People & Mind', emoji: '👥' },
  { id: 'knowledge', name: 'Knowledge & Culture', emoji: '📚' },
]

export const SUBTOPICS: readonly Subtopic[] = [
  // Life
  { id: 'daily-life', name: 'Daily Life', emoji: '🏠', domainId: 'life' },
  { id: 'health', name: 'Health & Body', emoji: '🏥', domainId: 'life' },
  { id: 'travel', name: 'Travel & Places', emoji: '✈️', domainId: 'life' },
  // Work
  { id: 'work', name: 'Work & Career', emoji: '💼', domainId: 'work' },
  { id: 'business', name: 'Business & Finance', emoji: '📊', domainId: 'work' },
  { id: 'technology', name: 'Technology & Innovation', emoji: '💻', domainId: 'work' },
  // Society
  { id: 'society', name: 'Society & Culture', emoji: '🏘️', domainId: 'society' },
  { id: 'politics', name: 'Politics & Government', emoji: '🏛️', domainId: 'society' },
  { id: 'law', name: 'Law & Justice', emoji: '⚖️', domainId: 'society' },
  { id: 'environment', name: 'Environment & Nature', emoji: '🌿', domainId: 'society' },
  // People
  { id: 'relationships', name: 'Relationships & People', emoji: '👥', domainId: 'people' },
  { id: 'emotions', name: 'Emotions & Mind', emoji: '🧠', domainId: 'people' },
  { id: 'communication', name: 'Communication & Media', emoji: '📡', domainId: 'people' },
  // Knowledge
  { id: 'education', name: 'Education & Learning', emoji: '📚', domainId: 'knowledge' },
  { id: 'science', name: 'Science & Research', emoji: '🔬', domainId: 'knowledge' },
  { id: 'arts', name: 'Arts & Entertainment', emoji: '🎨', domainId: 'knowledge' },
]

// Helper functions
export function getSubtopicsByDomain(domainId: DomainId): readonly Subtopic[] {
  return SUBTOPICS.filter(s => s.domainId === domainId)
}

export function getDomainBySubtopic(subtopicId: SubtopicId): Domain | undefined {
  const sub = SUBTOPICS.find(s => s.id === subtopicId)
  return sub ? DOMAINS.find(d => d.id === sub.domainId) : undefined
}

// Backward compatibility — flat list for existing code that uses TOPIC_REGISTRY
export const TOPIC_REGISTRY = SUBTOPICS
