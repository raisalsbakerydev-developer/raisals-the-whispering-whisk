import { Link } from 'react-router-dom'
import Container from '../common/Container'
import Section from '../common/Section'
import SectionHeading from '../common/SectionHeading'
import Button from '../common/Button'
import Reveal from '../common/Reveal'

function StorySection({ media }) {
  return <Section><Container><div className="grid items-center gap-12 lg:grid-cols-2 lg:gap-16"><Reveal className="order-2 lg:order-1 reveal-left"><div><SectionHeading eyebrow="Our Story" title="Baked from Our Home to Your Heart" description="What started with a love for baking grew into a little home bakery dedicated to creating desserts that make everyday moments sweeter." align="left" /><p className="max-w-xl text-base leading-7 text-[var(--color-text-muted)]">Behind every creation is a passion for homemade goodness, careful preparation and the joy of sharing something special with others. We believe the best treats are made with patience, care and a whole lot of love.</p><div className="mt-8"><Link to="/about"><Button variant="secondary">Meet Our Story</Button></Link></div></div></Reveal><Reveal className="order-1 lg:order-2 reveal-right" delay={120}><div className="group aspect-[4/5] overflow-hidden rounded-[2rem] bg-[var(--color-surface)] shadow-[var(--shadow-soft)]">{media?.url ? (media.resourceType === 'video' ? <video className="h-full w-full object-contain" src={media.url} muted loop autoPlay playsInline /> : <img className="h-full w-full object-contain" src={media.url} alt={media.altText || "Raisal's The Whispering Whisk story"} />) : <div className="placeholder-shimmer flex h-full items-center justify-center p-8 text-center text-[var(--color-text-muted)]"><div><p className="font-serif text-2xl text-[var(--color-text)]">Bakery / Team Photo</p><p className="mt-2 text-sm">Real photograph will be added later</p></div></div>}</div></Reveal></div></Container></Section>
}
export default StorySection
