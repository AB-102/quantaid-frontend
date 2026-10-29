import {
  Body,
  Button,
  Container,
  Font,
  Head,
  Hr,
  Html,
  Img,
  Section,
  Tailwind,
  Text,
} from 'react-email';

// DEV: for local preview (npm run dev). The preview server can't serve local files, so this reads the logo
// from frontend/ and encodes it as a base64 data URI. Email clients block data URIs, so switch back to PROD
// before 'npm run export'. The path starts from process.cwd() because npm runs scripts from transactional/,
// while __dirname points wherever react-email bundles the template.
// import { readFileSync } from 'fs';
// import { join } from 'path';
// const svg = readFileSync(join(process.cwd(), '../frontend/src/assets/quantaid-logo.svg'));
// const logoSrc = `data:image/svg+xml;base64,${svg.toString('base64')}`;
// const APP_URL = 'http://localhost:5173';

// PROD: absolute URLs, used for 'npm run export'. The logo is a PNG because Gmail and Outlook don't render SVG.
const logoSrc = 'https://quantaid.org/email-logo.png';
const APP_URL = 'https://quantaid.org';

// Placeholder constants substituted by the backend at send time
const USER_NAME = '{{user_name}}';

export default function Welcome() {
  return (
    <Tailwind config={{ theme: { extend: { colors: { accent: '#3B89FF', brand: '#030E29', sky: '#8CBAFF' } } } }}>
      <Html lang="en">
        <Head>
          <Font
            fontFamily="Inter"
            fallbackFontFamily="Arial"
            webFont={{
              url: 'https://fonts.gstatic.com/s/inter/v13/UcCO3FwrK3iLTeHuS_fvQtMwCp50KnMw2boKoduKmMEVuLyfAZ9hiA.woff2',
              format: 'woff2',
            }}
            fontWeight={400}
            fontStyle="normal"
          />
          <Font
            fontFamily="Inter"
            fallbackFontFamily="Arial"
            webFont={{
              url: 'https://fonts.gstatic.com/s/inter/v13/UcCO3FwrK3iLTeHuS_fvQtMwCp50KnMw2boKoduKmMEVuI6fAZ9hiA.woff2',
              format: 'woff2',
            }}
            fontWeight={600}
            fontStyle="normal"
          />
          <Font
            fontFamily="Inter"
            fallbackFontFamily="Arial"
            webFont={{
              url: 'https://fonts.gstatic.com/s/inter/v13/UcCO3FwrK3iLTeHuS_fvQtMwCp50KnMw2boKoduKmMEVuFuYAZ9hiA.woff2',
              format: 'woff2',
            }}
            fontWeight={700}
            fontStyle="normal"
          />
        </Head>
        <Body className="bg-[#f0f2f5] font-[Inter,Arial,sans-serif] py-8 m-0">
          <Container className="max-w-[600px] mx-auto bg-white rounded-[10px] overflow-hidden border border-[#e2e5ea]">

            <Section className="bg-brand px-10 py-6">
              <Img src={logoSrc} width={138} height={38} alt="Quantaid" className="block" />
            </Section>

            <Section className="px-10 pt-8 pb-6">
              <Text className="text-[18px] font-bold text-[#111827] mt-0 mb-5 leading-[1.5]">
                Hi {USER_NAME},
              </Text>
              <Text className="text-[15px] text-[#374151] leading-[1.65] mt-0 mb-4">
                Welcome to Quantaid. We're glad you're here.
              </Text>
              <Text className="text-[15px] text-[#374151] leading-[1.65] mt-0 mb-0">
                Quantaid teaches quantum computing from the ground up, with an AI tutor that explains each idea
                in a way that makes sense to you. Your account is ready, so start your first lesson whenever
                you like.
              </Text>
            </Section>

            <Hr className="border-[#e5e7eb] mx-10 my-0" />

            <Section className="px-10 py-7 text-center">
              <Button
                href={APP_URL}
                className="bg-accent text-white text-[13px] font-bold tracking-[0.08em] no-underline py-[14px] px-9 rounded-lg"
              >
                START LEARNING
              </Button>
            </Section>

            <Hr className="border-[#e5e7eb] mx-10 my-0" />

            <Section className="px-10 pt-7 pb-2">
              <Text className="text-[15px] font-bold text-[#111827] mt-0 mb-[14px] uppercase tracking-[0.05em]">
                Why Quantaid?
              </Text>
              <Text className="text-[14px] text-[#374151] leading-[1.65] mt-0 mb-3 pl-3 border-l-2 border-sky">
                <strong>Short Lessons and Quizzes:</strong> Learn one concept at a time, and check your
                understanding with quizzes as you go.
              </Text>
              <Text className="text-[14px] text-[#374151] leading-[1.65] mt-0 mb-3 pl-3 border-l-2 border-sky">
                <strong>Explanations on Demand:</strong> Highlight any text in a lesson and select Explain to
                have the AI tutor break it down.
              </Text>
              <Text className="text-[14px] text-[#374151] leading-[1.65] mt-0 mb-3 pl-3 border-l-2 border-sky">
                <strong>Analogies From Your Hobbies:</strong> The tutor relates quantum concepts to the
                interests in your profile, when that helps an idea click.
              </Text>
              <Text className="text-[14px] text-[#6b7280] leading-[1.65] mt-6 mb-0">
                Questions or ideas? Send them through the feedback button in the app.
              </Text>
            </Section>

            <Section className="px-10 pt-4 pb-9">
              <Text className="text-[15px] text-[#374151] leading-[1.65] mt-0 mb-1">
                Best,
              </Text>
              <Text className="text-[15px] font-semibold text-[#111827] mt-0 mb-0">
                The Quantaid Team
              </Text>
            </Section>

            <Section className="bg-[#f9fafb] border-t border-[#e5e7eb] px-10 py-4">
              <Text className="text-[12px] text-[#9ca3af] mt-0 mb-0 leading-[1.5]">
                You're receiving this email because you signed in to Quantaid for the first time.
              </Text>
            </Section>

          </Container>
        </Body>
      </Html>
    </Tailwind>
  );
}
