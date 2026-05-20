import { motion } from 'framer-motion'

import SEOMeta         from '../components/SEOMeta'
import Hero            from '../sections/Hero'
import StatsCounter    from '../sections/StatsCounter'
import AboutPreview    from '../sections/AboutPreview'
import ServicesPreview from '../sections/ServicesPreview'
import ClinicsCard     from '../sections/ClinicsCard'
import QueuePreview    from './QueuePreview'
import ReviewsCarousel from '../sections/ReviewsCarousel'
import BlogPreview     from '../sections/BlogPreview'

export default function Home() {
  return (
    <>
      <SEOMeta pageKey="home" structuredData="LocalBusiness" />

      {/* 🔥 Page Fade-in */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.6 }}
      >

        {/* Hero (fast entrance) */}
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7 }}
        >
          <Hero/>
        </motion.div>

        {/* Stats */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ delay: 0.1, duration: 0.6 }}
        >
          <StatsCounter/>
        </motion.div>

        {/* About */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ delay: 0.15, duration: 0.6 }}
        >
          <AboutPreview/>
        </motion.div>

        {/* Services */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ delay: 0.2, duration: 0.6 }}
        >
          <ServicesPreview/>
        </motion.div>

        {/* Clinics */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ delay: 0.25, duration: 0.6 }}
        >
          <ClinicsCard/>
        </motion.div>

        {/* Queue */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ delay: 0.3, duration: 0.6 }}
        >
          <QueuePreview/>
        </motion.div>

        

        {/* Blog */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ delay: 0.4, duration: 0.6 }}
        >
          <BlogPreview/>
        </motion.div>

      </motion.div>
    </>
  )
}