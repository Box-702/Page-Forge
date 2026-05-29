import type { PageComponent } from '@/types'

const uid = (): string => crypto.randomUUID()

const baseStyles = {
  bgColor: undefined,
  textColor: undefined,
  titleFontSize: undefined,
  bodyFontSize: undefined,
  bgImage: undefined,
  borderRadius: undefined,
  paddingTop: '64px',
  paddingBottom: '64px',
  paddingLeft: undefined,
  paddingRight: undefined,
  shadow: undefined,
  textAlign: undefined,
  maxWidth: undefined,
}

export function createDefaultFor(type: string): PageComponent | null {
  switch (type) {
    case 'hero':
      return {
        id: uid(),
        type: 'hero',
        content: {
          title: 'Build a sharper landing page',
          subtitle: 'Compose sections, preview instantly and export clean HTML when the page is ready.',
          ctaText: 'Start now',
          ctaLink: '#',
          ctaVariant: 'primary',
          alignment: 'center',
          backgroundType: 'color',
          imageUrl: '',
        },
        styles: { ...baseStyles, bgColor: '#ffffff', textAlign: 'text-center' },
      }
    case 'features':
      return {
        id: uid(),
        type: 'features',
        content: {
          title: 'Product features',
          subtitle: 'Show the capabilities that make the product worth trying.',
          columns: 3,
          features: [
            { id: uid(), icon: ':', title: 'Visual builder', description: 'Arrange sections and content without touching code.' },
            { id: uid(), icon: ':', title: 'Live preview', description: 'Review layout changes as you edit the page.' },
            { id: uid(), icon: ':', title: 'Clean export', description: 'Download static HTML that can be hosted anywhere.' },
          ],
        },
        styles: { ...baseStyles, bgColor: '#f9fafb' },
      }
    case 'pricing':
      return {
        id: uid(),
        type: 'pricing',
        content: {
          title: 'Pricing',
          subtitle: 'Choose the plan that fits your workflow.',
          currency: '$',
          plans: [
            { id: uid(), name: 'Free', price: '0', period: '/mo', description: 'For personal projects.', features: ['1 page', 'Basic blocks', 'HTML export'], highlighted: false, ctaText: 'Get started' },
            { id: uid(), name: 'Pro', price: '19', period: '/mo', description: 'For small teams.', features: ['Unlimited pages', 'All blocks', 'Templates', 'Priority support'], highlighted: true, ctaText: 'Subscribe' },
            { id: uid(), name: 'Business', price: '99', period: '/mo', description: 'For growing companies.', features: ['Team workflows', 'Brand presets', 'Custom support'], highlighted: false, ctaText: 'Contact sales' },
          ],
        },
        styles: { ...baseStyles, bgColor: '#ffffff' },
      }
    case 'cta':
      return {
        id: uid(),
        type: 'cta',
        content: {
          title: 'Ready to publish?',
          subtitle: 'Create a focused page and move from draft to launch faster.',
          ctaText: 'Get started',
          ctaLink: '#',
          ctaVariant: 'light',
        },
        styles: { ...baseStyles, bgColor: '#2563eb', textColor: '#ffffff', textAlign: 'text-center' },
      }
    case 'testimonials':
      return {
        id: uid(),
        type: 'testimonials',
        content: {
          title: 'What customers say',
          subtitle: 'Use proof from real users to build trust.',
          columns: 3,
          testimonials: [
            { id: uid(), quote: 'The builder helped us ship a page in one afternoon.', name: 'Alex Chen', title: 'Founder', avatarUrl: '' },
            { id: uid(), quote: 'The exported HTML was easy to host and modify.', name: 'Mia Park', title: 'Product Lead', avatarUrl: '' },
            { id: uid(), quote: 'It is much faster than starting from a blank canvas.', name: 'Noah Smith', title: 'Designer', avatarUrl: '' },
          ],
        },
        styles: { ...baseStyles, bgColor: '#f9fafb' },
      }
    case 'faq':
      return {
        id: uid(),
        type: 'faq',
        content: {
          title: 'Frequently asked questions',
          subtitle: 'Answer the concerns that would otherwise slow conversion.',
          faqs: [
            { id: uid(), question: 'Where can I host the exported page?', answer: 'The exported HTML can be hosted on static platforms such as GitHub Pages, Vercel or Netlify.' },
            { id: uid(), question: 'Can I use my own domain?', answer: 'Yes. The exported page is a static file that you control.' },
            { id: uid(), question: 'Can this be used commercially?', answer: 'Yes. The page content and exported HTML belong to you.' },
          ],
        },
        styles: { ...baseStyles, bgColor: '#ffffff' },
      }
    case 'footer':
      return {
        id: uid(),
        type: 'footer',
        content: {
          companyName: 'Page Forge',
          description: 'A landing page builder for quickly shaping and exporting focused marketing pages.',
          copyright: `Copyright ${new Date().getFullYear()} Page Forge. All rights reserved.`,
          links: [
            { id: uid(), title: 'Features', url: '#' },
            { id: uid(), title: 'Pricing', url: '#' },
            { id: uid(), title: 'About', url: '#' },
            { id: uid(), title: 'Contact', url: '#' },
          ],
        },
        styles: { ...baseStyles, bgColor: '#111827', textColor: '#ffffff', paddingTop: '48px', paddingBottom: '48px' },
      }
    case 'row':
      return {
        id: uid(),
        type: 'row',
        content: {
          columnCount: 2,
          columnWidths: ['1/2', '1/2'],
          gap: '8',
          verticalAlign: 'start',
          columns: [
            { id: uid(), width: '50%', children: [] },
            { id: uid(), width: '50%', children: [] },
          ],
        },
        styles: { ...baseStyles },
      }
    default:
      return null
  }
}
