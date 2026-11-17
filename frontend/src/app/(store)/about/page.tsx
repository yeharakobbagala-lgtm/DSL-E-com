import React from 'react';
import Image from 'next/image';
import Link from 'next/link';
import AboutVideoShowcase from '@/components/about/AboutVideoShowcase';
import {
  Phone,
  Mail,
  MapPin,
  Sparkles,
  ArrowRight,
  Handshake,
  Globe,
  Lightbulb,
  Target,
  Compass,
  Heart,
  Award,
  Play,
} from 'lucide-react';

export const metadata = {
  title: 'About Us | DSL Enterprises (Pvt) Ltd',
  description:
    'Empowering Education & Inspiring Creativity. Discover DSL Enterprises, our heritage since 2009, world-class stationery brands, and our nationwide community impact.',
};

export default function AboutPage() {
  return (
    <div className="min-h-screen bg-white text-[#2D3748] font-sans selection:bg-[#E2ECD5] selection:text-[#284218]">
      {/* ========================================================= */}
      {/* 1. HERO BANNER: Full-width cinematic banner with bold     */}
      {/* warm typography matching reference design                 */}
      {/* ========================================================= */}
      <section className="relative w-full h-[380px] sm:h-[460px] md:h-[520px] overflow-hidden bg-[#1a1714]">
        <Image
          src="/hero-stationery-hd.jpg"
          alt="DSL Stationery - Empowering Education, Inspiring Creativity"
          fill
          priority
          className="object-cover object-center brightness-[0.88] contrast-[1.05]"
          sizes="100vw"
        />

        {/* Cinematic gradient overlay matching reference warm vignette */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/40 to-black/25 pointer-events-none" />

        {/* Hero Title Typography (Bottom-anchored, warm cream tone) */}
        <div className="relative z-10 h-full max-w-5xl mx-auto px-6 flex flex-col justify-end pb-12 sm:pb-16 text-center">
          <h1 className="text-3xl sm:text-5xl md:text-[56px] font-extrabold text-[#FBF8F1] tracking-tight leading-[1.15] drop-shadow-lg">
            <span>Empowering Education.</span>
            <br />
            <span>Inspiring Creativity.</span>
          </h1>
        </div>
      </section>

      {/* ========================================================= */}
      {/* 2. OUR STORY SECTION: 2-column layout with quote on left  */}
      {/* and 3 vertical capsule photos on right                    */}
      {/* ========================================================= */}
      <section id="story" className="relative py-16 sm:py-24 bg-white overflow-hidden">
        <div className="max-w-6xl mx-auto px-6 sm:px-8">
          {/* Section Heading with Accent Underline */}
          <div className="text-center mb-12 sm:mb-16">
            <h2 className="text-2xl sm:text-3xl md:text-4xl font-extrabold text-[#1F2937] tracking-tight pb-2 border-b-2 border-[#1F2937] inline-block">
              Our Story
            </h2>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-14 items-center">
            {/* Left Column: Narrative quote & CTA button */}
            <div className="lg:col-span-6 space-y-7 text-center lg:text-left">
              <p className="text-base sm:text-lg md:text-[18.5px] text-[#374151] leading-relaxed font-normal">
                &ldquo;Born out of a dedication to quality stationery and empowering young minds, DSL Enterprises (Pvt)
                Ltd connects Sri Lanka to world-class writing and creative essentials. We believe in inspiring students,
                empowering schools and offices, and providing reliable, accessible tools that nurture a lifetime of
                learning and imagination.&rdquo;
              </p>

              <div className="flex flex-wrap items-center justify-center lg:justify-start gap-3">
                <Link
                  href="/brands"
                  className="inline-flex items-center justify-center bg-[#287A34] hover:bg-[#20632A] text-white font-medium text-xs sm:text-sm px-7 py-3 rounded-full transition-all duration-200 shadow-sm hover:shadow-md hover:scale-[1.02] active:scale-95"
                >
                  Discover Our Brands
                </Link>
                <a
                  href="#experience"
                  className="inline-flex items-center justify-center gap-2 bg-stone-100 hover:bg-stone-200 text-[#1F2937] font-medium text-xs sm:text-sm px-5 py-3 rounded-full transition-all duration-200 border border-stone-300 shadow-2xs hover:scale-[1.02] active:scale-95"
                >
                  <Play className="w-3.5 h-3.5 fill-[#1F2937]" />
                  <span>Watch Event Video</span>
                </a>
              </div>
            </div>

            {/* Right Column: Trio of Vertical Stadium/Capsule Photos */}
            <div className="lg:col-span-6">
              <div className="grid grid-cols-3 gap-3 sm:gap-4 items-center max-w-md sm:max-w-lg mx-auto lg:max-w-none">
                {/* Capsule 1: Student / Learning Focus */}
                <div className="relative h-64 sm:h-80 md:h-88 rounded-full overflow-hidden shadow-md bg-[#FFF7ED] border border-amber-200/60 group">
                  <Image
                    src="/images/hero-schoolgirl-perfect.png"
                    alt="Student with school supplies"
                    fill
                    className="object-cover object-top transition-transform duration-500 group-hover:scale-105"
                    sizes="(max-width: 640px) 110px, 180px"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-amber-950/25 via-transparent to-transparent pointer-events-none" />
                </div>

                {/* Capsule 2 (Center): Slightly taller & offset upwards like reference */}
                <div className="relative h-72 sm:h-88 md:h-96 -translate-y-3 sm:-translate-y-4 rounded-full overflow-hidden shadow-xl bg-[#E8F3E5] border border-emerald-200/60 group">
                  <Image
                    src="/hero-stationery-hd.jpg"
                    alt="Inspiring desk stationery collection"
                    fill
                    className="object-cover object-center transition-transform duration-500 group-hover:scale-105"
                    sizes="(max-width: 640px) 120px, 200px"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-emerald-950/30 via-transparent to-transparent pointer-events-none" />
                </div>

                {/* Capsule 3: Library / Books / Knowledge Space */}
                <div className="relative h-64 sm:h-80 md:h-88 rounded-full overflow-hidden shadow-md bg-[#EFF6FF] border border-blue-200/60 group">
                  <Image
                    src="/assets/library/scene2-user-library-fullhd.jpg"
                    alt="Inspiring library and creative workspace"
                    fill
                    className="object-cover object-center transition-transform duration-500 group-hover:scale-105"
                    sizes="(max-width: 640px) 110px, 180px"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-blue-950/25 via-transparent to-transparent pointer-events-none" />
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ========================================================= */}
      {/* 2.5 VIDEO SHOWCASE: DOMS Kiddies Corner / Art in Action   */}
      {/* ========================================================= */}
      <div id="experience">
        <AboutVideoShowcase />
      </div>

      {/* ========================================================= */}
      {/* 3. ABOUT US: Our Identity, Vision and Values              */}
      {/* Warm beige background + Floating overlapping green banner */}
      {/* + 2-Column white card with vertical divider               */}
      {/* ========================================================= */}
      <section className="relative py-20 sm:py-28 bg-[#F6F1E8] overflow-hidden">
        {/* Subtle decorative background motifs */}
        <div
          className="absolute inset-0 opacity-[0.035] pointer-events-none bg-repeat"
          style={{
            backgroundImage: `radial-gradient(circle at 2px 2px, #42542A 1.5px, transparent 0)`,
            backgroundSize: '28px 28px',
          }}
        />

        <div className="relative z-10 max-w-5xl mx-auto px-5 sm:px-8">
          {/* Section Kicker and Main Title */}
          <div className="text-center mb-10 sm:mb-12">
            <span className="block text-xs sm:text-sm font-bold tracking-[0.22em] text-[#55733A] uppercase mb-2">
              ABOUT US
            </span>
            <h2 className="text-2xl sm:text-4xl md:text-[42px] font-extrabold text-[#1F2937] tracking-tight leading-snug">
              Our Identity,
              <br />
              Vision and Values
            </h2>
          </div>

          {/* Floating Overlapping Green Values Pill Banner */}
          <div className="relative z-20 max-w-4xl mx-auto -mb-10 sm:-mb-12">
            <div className="bg-[#5D7A3E] text-white rounded-[26px] sm:rounded-[36px] shadow-xl px-4 sm:px-8 py-5 sm:py-6 border border-[#6E8F4A]/40">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 sm:gap-6 text-center">
                {/* Pillar 1 */}
                <div className="flex flex-col items-center justify-center p-2 group">
                  <div className="w-10 h-10 rounded-full bg-white/15 flex items-center justify-center mb-2.5 transition-transform group-hover:scale-110">
                    <Award className="w-5 h-5 text-white" />
                  </div>
                  <span className="text-xs sm:text-sm font-semibold tracking-wide">
                    Quality &amp; Craft
                  </span>
                </div>

                {/* Pillar 2 */}
                <div className="flex flex-col items-center justify-center p-2 group">
                  <div className="w-10 h-10 rounded-full bg-white/15 flex items-center justify-center mb-2.5 transition-transform group-hover:scale-110">
                    <Handshake className="w-5 h-5 text-white" />
                  </div>
                  <span className="text-xs sm:text-sm font-semibold tracking-wide">
                    Trust &amp; Transparency
                  </span>
                </div>

                {/* Pillar 3 */}
                <div className="flex flex-col items-center justify-center p-2 group">
                  <div className="w-10 h-10 rounded-full bg-white/15 flex items-center justify-center mb-2.5 transition-transform group-hover:scale-110">
                    <Globe className="w-5 h-5 text-white" />
                  </div>
                  <span className="text-xs sm:text-sm font-semibold tracking-wide">
                    Islandwide Reach
                  </span>
                </div>

                {/* Pillar 4 */}
                <div className="flex flex-col items-center justify-center p-2 group">
                  <div className="w-10 h-10 rounded-full bg-white/15 flex items-center justify-center mb-2.5 transition-transform group-hover:scale-110">
                    <Lightbulb className="w-5 h-5 text-white" />
                  </div>
                  <span className="text-xs sm:text-sm font-semibold tracking-wide">
                    Innovation &amp; Learning
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Vision & Mission White Card (padded top to allow overlapping pill) */}
          <div className="bg-white rounded-[32px] sm:rounded-[40px] shadow-lg border border-stone-200/70 max-w-4xl mx-auto pt-16 sm:pt-20 pb-12 sm:pb-14 px-6 sm:px-12 md:px-16">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 md:gap-14 relative">
              {/* Vertical center divider line on desktop */}
              <div className="hidden md:block absolute top-4 bottom-4 left-1/2 w-px bg-stone-200 -translate-x-1/2" />

              {/* Left Column: Vision */}
              <div className="space-y-3">
                <div className="flex items-center gap-2.5 text-[#1F2937]">
                  <Target className="w-5 h-5 text-[#5D7A3E]" />
                  <h3 className="text-lg sm:text-xl font-bold tracking-tight">Vision</h3>
                </div>
                <p className="text-xs sm:text-sm md:text-[15px] text-[#4B5563] leading-relaxed">
                  To be Sri Lanka&apos;s leading fresh educational and creative supply partner, fostering academic
                  excellence, artistic expression, and lifelong learning across every community.
                </p>
              </div>

              {/* Right Column: Mission */}
              <div className="space-y-3">
                <div className="flex items-center gap-2.5 text-[#1F2937]">
                  <Compass className="w-5 h-5 text-[#5D7A3E]" />
                  <h3 className="text-lg sm:text-xl font-bold tracking-tight">Mission</h3>
                </div>
                <p className="text-xs sm:text-sm md:text-[15px] text-[#4B5563] leading-relaxed">
                  To source, deliver, and inspire access to the finest stationery and educational essentials with
                  integrity, continuous innovation, islandwide accessibility, and heart.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ========================================================= */}
      {/* 4. COMMUNITY & IMPACT (LITTLE HEARTS & LADY RIDGEWAY)     */}
      {/* Preserving authentic DSL philanthropic initiatives        */}
      {/* ========================================================= */}
      <section id="impact" className="py-16 sm:py-20 bg-white">
        <div className="max-w-5xl mx-auto px-5 sm:px-8 space-y-10">
          <div className="text-center space-y-2">
            <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-rose-50 border border-rose-200 text-rose-700 text-xs font-bold uppercase tracking-wider">
              <Heart className="w-3.5 h-3.5 fill-rose-500 text-rose-500" />
              <span>Philanthropy &amp; Giving Back</span>
            </div>
            <h2 className="text-2xl sm:text-3xl font-extrabold text-[#1F2937] tracking-tight">
              Community &amp; Impact
            </h2>
            <p className="text-xs sm:text-sm text-[#6B7280] max-w-xl mx-auto">
              Every purchase of designated DSL writing instruments directly supports lifesaving pediatric care in Sri Lanka.
            </p>
          </div>

          {/* 3 Impact Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-5 sm:gap-6">
            {/* Card 1: Little Heart Mascot */}
            <div className="bg-[#FFF3EE] rounded-3xl p-6 flex flex-col items-center justify-center text-center shadow-xs border border-rose-100 hover:shadow-md transition-shadow">
              <div className="relative w-28 h-28 mb-3">
                <Image
                  src="/images/about/dsl-little-heart.png"
                  alt="Little Hearts Project Initiative"
                  fill
                  className="object-contain"
                />
              </div>
              <h4 className="text-sm font-bold text-[#1F2937]">Little Hearts Project</h4>
              <p className="text-[11.5px] text-[#4B5563] mt-1">
                Dedicated pens &amp; pencils under the Speed and Camlin brands directly donate proceeds to childhood care.
              </p>
            </div>

            {/* Card 2: Community Hand */}
            <div className="bg-[#FFF3EE] rounded-3xl p-6 flex flex-col items-center justify-center text-center shadow-xs border border-rose-100 hover:shadow-md transition-shadow">
              <div className="relative w-28 h-28 mb-3">
                <Image
                  src="/images/about/dsl-community-hand.png"
                  alt="Helping Hands and Care"
                  fill
                  className="object-contain"
                />
              </div>
              <h4 className="text-sm font-bold text-[#1F2937]">Hands That Care</h4>
              <p className="text-[11.5px] text-[#4B5563] mt-1">
                Active involvement in student sponsorships, art workshops, and school equipment programs islandwide.
              </p>
            </div>

            {/* Card 3: Lady Ridgeway Hospital */}
            <div className="bg-[#FFF3EE] rounded-3xl p-6 flex flex-col items-center justify-center text-center shadow-xs border border-rose-100 hover:shadow-md transition-shadow">
              <div className="relative w-28 h-28 mb-3">
                <Image
                  src="/images/about/dsl-cardiac-hospital.png"
                  alt="Lady Ridgeway Hospital Cardiac Care"
                  fill
                  className="object-contain"
                />
              </div>
              <h4 className="text-sm font-bold text-[#1F2937]">Lady Ridgeway Hospital</h4>
              <p className="text-[11.5px] text-[#4B5563] mt-1">
                Contributing to the Cardiac and Critical Care Complex to ensure no child waits for critical surgery.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ========================================================= */}
      {/* 5. DISTRIBUTION NETWORK & CONTACT HEADQUARTERS            */}
      {/* ========================================================= */}
      <section id="contact" className="py-16 sm:py-20 bg-[#F4F7FA] border-t border-slate-200/80">
        <div className="max-w-5xl mx-auto px-5 sm:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-center">
            {/* Map on Left */}
            <div className="lg:col-span-5 flex justify-center">
              <div className="w-68 h-76 sm:w-76 sm:h-84 relative">
                <Image
                  src="/images/about/dsl-sri-lanka-map-v2.png"
                  alt="DSL Enterprises Distribution Network Sri Lanka"
                  fill
                  className="object-contain drop-shadow-sm"
                />
              </div>
            </div>

            {/* Contact Details on Right */}
            <div className="lg:col-span-7 space-y-5">
              <div>
                <span className="text-xs font-bold tracking-wider text-[#2E7D32] uppercase">
                  Islandwide Supply Network
                </span>
                <h3 className="text-xl sm:text-2xl font-black text-[#1F2937] tracking-tight mt-1">
                  Moratuwa Headquarters &amp; Distribution Hubs
                </h3>
                <p className="text-xs sm:text-sm text-[#4B5563] mt-1">
                  Serving schools, retail bookshops, and nationwide customers directly from our central facilities.
                </p>
              </div>

              <div className="space-y-3 text-xs sm:text-sm">
                {/* Landline */}
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-emerald-50 text-[#2E7D32] flex items-center justify-center shrink-0">
                    <Phone className="w-4 h-4" />
                  </div>
                  <div>
                    <span className="font-semibold text-[#1F2937] mr-2">Office Line:</span>
                    <a href="tel:+94382236094" className="text-[#08275E] font-bold hover:underline">
                      +94 38 223 6094
                    </a>
                  </div>
                </div>

                {/* Mobile / WhatsApp */}
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-emerald-50 text-[#2E7D32] flex items-center justify-center shrink-0">
                    <Phone className="w-4 h-4" />
                  </div>
                  <div>
                    <span className="font-semibold text-[#1F2937] mr-2">Direct / WhatsApp:</span>
                    <a href="tel:+94773553555" className="text-[#08275E] font-bold hover:underline">
                      +94 77 355 3555
                    </a>
                  </div>
                </div>

                {/* Email */}
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-emerald-50 text-[#2E7D32] flex items-center justify-center shrink-0">
                    <Mail className="w-4 h-4" />
                  </div>
                  <div>
                    <span className="font-semibold text-[#1F2937] mr-2">Customer Care:</span>
                    <a href="mailto:support@dslstationery.lk" className="text-[#08275E] font-bold hover:underline">
                      support@dslstationery.lk
                    </a>
                  </div>
                </div>

                {/* Addresses */}
                <div className="flex items-start gap-3 pt-1">
                  <div className="w-8 h-8 rounded-full bg-emerald-50 text-[#2E7D32] flex items-center justify-center shrink-0 mt-0.5">
                    <MapPin className="w-4 h-4" />
                  </div>
                  <div className="space-y-1 text-[#374151]">
                    <div>
                      <strong className="text-[#1F2937]">Head Office:</strong> 30/3, Main Street, Moratuwa, Sri Lanka
                    </div>
                    <div>
                      <strong className="text-[#1F2937]">Central Distribution:</strong> No 14, Old Kottawa Road, Mirihana, Nugegoda
                    </div>
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="pt-2 flex flex-wrap gap-3">
                <Link
                  href="/shop"
                  className="inline-flex items-center gap-2 bg-[#2E7D32] hover:bg-[#256629] text-white text-xs font-bold px-6 py-2.5 rounded-full shadow-sm transition-transform hover:scale-105"
                >
                  <span>Explore Stationery Store</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </Link>
                <Link
                  href="/contact"
                  className="inline-flex items-center gap-2 bg-white hover:bg-stone-50 text-[#1F2937] text-xs font-bold px-6 py-2.5 rounded-full border border-stone-300 shadow-xs transition-transform hover:scale-105"
                >
                  <Sparkles className="w-3.5 h-3.5 text-[#2E7D32]" />
                  <span>Contact Our Team</span>
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
