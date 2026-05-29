import type { PageComponent, PageSettings } from '@/types'
import { createDefaultFor } from '@/utils/defaults'

export interface PageTemplate {
  id: string
  name: string
  description: string
  settings: Partial<PageSettings>
  create: () => PageComponent[]
}

function block(type: string, patch?: Partial<PageComponent>): PageComponent {
  const component = createDefaultFor(type)
  if (!component) throw new Error(`Unknown block type: ${type}`)
  const content = { ...component.content, ...patch?.content }

  if (type === 'row' && patch?.children?.length) {
    const columns = content.columns || []
    content.columns = columns.map((column: any, index: number) => ({
      ...column,
      children: patch.children?.filter((_, childIndex) => childIndex % columns.length === index) || [],
    }))
  }

  return {
    ...component,
    ...patch,
    content,
    styles: { ...component.styles, ...patch?.styles },
  }
}

export const templates: PageTemplate[] = [
  {
    id: 'saas-launch',
    name: 'SaaS launch',
    description: 'A full conversion path with hero, features, pricing, testimonials, FAQ and footer.',
    settings: {
      title: 'SaaS Launch Page',
      description: 'A conversion-focused SaaS landing page.',
      primaryColor: '#2563eb',
      backgroundColor: '#f8fafc',
    },
    create: () => [
      block('hero'),
      block('features'),
      block('pricing'),
      block('testimonials'),
      block('faq'),
      block('cta'),
      block('footer'),
    ],
  },
  {
    id: 'waitlist',
    name: 'Product waitlist',
    description: 'A short validation page for collecting early users.',
    settings: {
      title: 'Waitlist Landing Page',
      description: 'A lean waitlist page for early product validation.',
      primaryColor: '#0f766e',
      backgroundColor: '#f7fbf8',
    },
    create: () => [
      block('hero', {
        content: {
          title: 'Collect your first users before launch',
          subtitle: 'Explain the value, show early proof and make the waitlist action obvious.',
          ctaText: 'Join the waitlist',
        },
        styles: { bgColor: '#f7fbf8', textAlign: 'text-center' },
      }),
      block('features', {
        content: { title: 'Why it is worth waiting for', subtitle: 'Answer the questions early users care about.', columns: 3 },
      }),
      block('testimonials', {
        content: { title: 'Early signals', subtitle: 'Show the proof you already have.', columns: 2 },
      }),
      block('cta', {
        content: { title: 'Join now for early access', ctaText: 'Submit email' },
        styles: { bgColor: '#0f766e', textColor: '#ffffff', textAlign: 'text-center' },
      }),
      block('footer'),
    ],
  },
  {
    id: 'agency-service',
    name: 'Service agency',
    description: 'A service-business structure for consulting, design and development teams.',
    settings: {
      title: 'Agency Service Page',
      description: 'A landing page for service businesses.',
      primaryColor: '#7c3aed',
      backgroundColor: '#fbfafc',
    },
    create: () => [
      block('hero', {
        content: {
          title: 'Package your service into a clear buying path',
          subtitle: 'Use cases, capabilities, pricing and FAQs to reduce decision cost.',
          ctaText: 'Book a call',
        },
      }),
      block('features', {
        content: { title: 'Core services', subtitle: 'Help customers understand what you solve.', columns: 3 },
      }),
      block('row', {
        children: [
          block('cta', {
            content: { title: 'Need a custom plan?', subtitle: 'Share your goal and budget to get first recommendations.', ctaText: 'Contact us' },
          }),
          block('faq'),
        ],
      }),
      block('testimonials'),
      block('footer'),
    ],
  },
  {
    id: 'app-download',
    name: 'App download',
    description: 'For mobile apps, tools and browser extensions.',
    settings: {
      title: 'App Download Page',
      description: 'A focused app landing page with product value and download CTA.',
      primaryColor: '#ea580c',
      backgroundColor: '#fff7ed',
    },
    create: () => [
      block('hero', {
        content: { title: 'Help users understand your app in one minute', subtitle: 'Highlight the core scenario, main benefit and download action.', ctaText: 'Download now' },
        styles: { bgColor: '#fff7ed', textAlign: 'text-center' },
      }),
      block('features', { content: { title: 'Core experience', subtitle: 'Explain the three moments users will come back for.', columns: 3 } }),
      block('testimonials', { content: { title: 'User feedback', subtitle: 'Use real comments to lower download hesitation.', columns: 3 } }),
      block('faq'),
      block('footer'),
    ],
  },
  {
    id: 'course-sales',
    name: 'Course sales',
    description: 'For courses, workshops and cohort programs.',
    settings: {
      title: 'Course Sales Page',
      description: 'A landing page for online courses and workshops.',
      primaryColor: '#be123c',
      backgroundColor: '#fff7f8',
    },
    create: () => [
      block('hero', { content: { title: 'Turn your course into a clear enrollment page', subtitle: 'Use outcomes, curriculum, student feedback and FAQ to support conversion.', ctaText: 'Enroll now' } }),
      block('features', { content: { title: 'What students get', subtitle: 'Focus on the practical change your course creates.', columns: 3 } }),
      block('pricing', { content: { title: 'Enrollment options', subtitle: 'Show prices, benefits and fit clearly.' } }),
      block('testimonials'),
      block('faq'),
      block('footer'),
    ],
  },
  {
    id: 'event-registration',
    name: 'Event registration',
    description: 'For launches, salons, webinars and live events.',
    settings: {
      title: 'Event Registration Page',
      description: 'A landing page for events and registration campaigns.',
      primaryColor: '#0891b2',
      backgroundColor: '#f0fdff',
    },
    create: () => [
      block('hero', { content: { title: 'Launch your next event', subtitle: 'Explain the topic, audience and reason to attend.', ctaText: 'Register now' } }),
      block('features', { content: { title: 'Event highlights', subtitle: 'Use three points to show why it is worth attending.', columns: 3 } }),
      block('cta', { content: { title: 'Limited seats, reserve yours early', ctaText: 'Register' }, styles: { bgColor: '#0891b2', textColor: '#ffffff', textAlign: 'text-center' } }),
      block('faq'),
      block('footer'),
    ],
  },
]
