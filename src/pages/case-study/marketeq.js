import React, { useState, useEffect } from 'react';
import PropTypes from 'prop-types';
import { Link } from 'gatsby';
import styled from 'styled-components';
import { Layout } from '@components';
import sr from '@utils/sr';
import { srConfig } from '@config';

const StyledCaseStudyContainer = styled.main`
  width: 100%;
  max-width: 1600px;
  margin: 0 auto;
  padding: 80px 100px;
  padding-right: 80px;
  display: grid;
  grid-template-columns: 250px 1fr;
  justify-content: center;

  @media (max-width: 900px) {
    grid-template-columns: 1fr;
    padding: 60px 25px;
    gap: 40px;
  }
`;

const StyledHeaderDetails = styled.div`
  width: 100%;
  margin-bottom: 40px;
  scroll-margin-top: 100px;
`;

// const StyledDivider = styled.hr`
//   border: 0;
//   height: 1px;
//   background-color: var(--lightest-navy);
//   max-width: 1100px;
//   margin: 0 auto;
//
//   @media (max-width: 900px) {
//     max-width: calc(100% - 50px);
//   }
// `;

const StyledBanner = styled.div`
  width: 100%;
  max-width: none;
  margin: 0 0 40px 0;
  padding: 100px 0 0 0;
  position: relative;

  img, video {
    width: 100%;
    height: 680px;
    object-fit: cover;
    border-radius: 0;

    @media (max-width: 900px) {
      height: auto;
      aspect-ratio: 16/9;
    }
  }

  @media (max-width: 900px) {
    padding: 0;
    margin-top: 0;
  }
`;

const StyledTOC = styled.aside`
  position: sticky;
  top: 100px;
  height: max-content;
  text-align: left;

  @media (max-width: 900px) {
    display: none;
  }

  ul {
    list-style: none;
    padding: 0;
    margin: 0;

    li {
      margin-bottom: 15px;

      a {
        color: var(--slate);
        font-family: var(--font-mono);
        font-size: 14px;
        text-decoration: none;
        transition: var(--transition);
        position: relative;
        display: inline-block;

        &:hover,
        &.active {
          color: var(--green);
        }

        &.active:before {
          content: '▹';
          position: absolute;
          left: -20px;
          color: var(--green);
        }
      }
    }
  }
`;

const StyledContentArea = styled.div`
  display: flex;
  flex-direction: column;
`;

const StyledHero = styled.div`
  display: flex;
  flex-direction: column;
  margin-bottom: 50px;

  .internship-tag {
    color: var(--green);
    font-family: var(--font-mono);
    font-size: var(--fz-sm);
    margin-bottom: 15px;
    text-transform: uppercase;
    letter-spacing: 1.5px;
  }

  h1 {
    font-size: clamp(36px, 6vw, 52px);
    color: var(--white);
    margin: 0 0 20px 0;
    line-height: 1.1;
  }

  .tagline {
    font-size: var(--fz-xl);
    line-height: 1.3;
    margin-bottom: 10px;
  }

  .subtagline {
    color: var(--slate);
    font-size: var(--fz-lg);
    line-height: 1.4;
    font-style: italic;
    margin-bottom: 0;
  }
`;

const StyledMetricsContainer = styled.div`
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 20px;
  margin-bottom: 60px;

  @media (max-width: 600px) {
    grid-template-columns: 1fr;
    gap: 15px;
  }
`;

const MetricCard = styled.div`
  background: var(--card-bg);
  border: 1px solid var(--card-border);
  padding: 30px 20px;
  border-radius: var(--border-radius);
  text-align: center;
  transition: var(--transition);

  &:hover {
    transform: translateY(-5px);
    border-color: var(--green);
  }

  .value {
    font-size: clamp(32px, 5vw, 44px);
    font-weight: 700;
    color: var(--green);
    margin-bottom: 10px;
  }

  .label {
    font-size: var(--fz-sm);
    color: var(--light-slate);
    line-height: 1.4;
  }
`;

const StyledMetadataRow = styled.div`
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 30px;
  margin-bottom: 80px;
  border-top: 1px solid var(--lightest-navy);
  border-bottom: 1px solid var(--lightest-navy);
  padding: 40px 0;

  @media (max-width: 1000px) {
    grid-template-columns: repeat(2, 1fr);
    gap: 30px;
  }

  @media (max-width: 600px) {
    grid-template-columns: 1fr;
    gap: 20px;
    padding: 30px 0;
  }

  .meta-item {
    h3 {
      font-size: var(--fz-xs);
      font-family: var(--font-mono);
      color: var(--green);
      margin-bottom: 12px;
      text-transform: uppercase;
      letter-spacing: 1px;
    }
    p {
      color: var(--light-slate);
      margin: 0;
      font-size: var(--fz-sm);
      line-height: 1.5;
    }
  }
`;

const StyledSection = styled.section`
  margin-bottom: 80px;
  scroll-margin-top: 100px;

  h2 {
    font-size: clamp(24px, 4vw, 32px);
    color: var(--lightest-slate);
    margin: 0 0 30px 0;
    display: flex;
    align-items: center;

    &:before {
      content: '▹';
      color: var(--green);
      margin-right: 15px;
      font-size: 24px;
    }
  }

  .section-subtitle {
    color: var(--lightest-slate);
    font-size: var(--fz-xl);
    font-weight: 500;
    margin-bottom: 25px;
    line-height: 1.4;
  }

  p {
    color: var(--slate);
    font-size: var(--fz-lg);
    margin-bottom: 25px;
    line-height: 1.6;
  }

  ul {
    padding-left: 20px;
    color: var(--slate);
    margin-bottom: 25px;
    li {
      margin-bottom: 12px;
      font-size: var(--fz-lg);
      line-height: 1.6;
    }
  }
`;

const StyledQuickContext = styled.div`
  background: var(--light-navy);
  border-left: 3px solid var(--green);
  border-radius: var(--border-radius);
  padding: 35px;
  margin: 40px 0 60px;

  h3.context-title {
    font-size: var(--fz-lg);
    color: var(--white);
    margin: 0 0 25px 0;
    font-weight: 600;
  }

  .context-grid {
    display: grid;
    grid-template-columns: repeat(3, 1fr);
    gap: 30px;

    @media (max-width: 768px) {
      grid-template-columns: 1fr;
      gap: 20px;
    }
  }

  .context-card {
    h4 {
      font-size: var(--fz-md);
      color: var(--green);
      margin: 0 0 10px 0;
      font-weight: 500;
    }
    p {
      font-size: var(--fz-sm);
      color: var(--slate);
      line-height: 1.5;
      margin: 0;
    }
  }
`;

const StyledHMW = styled.div`
  background: var(--card-bg);
  border: 1px solid var(--card-border);
  border-radius: var(--border-radius);
  padding: 40px;
  margin: 50px 0;
  text-align: center;
  position: relative;

  .hmw-label {
    font-family: var(--font-mono);
    font-size: var(--fz-xs);
    color: var(--green);
    text-transform: uppercase;
    letter-spacing: 2px;
    display: block;
    margin-bottom: 20px;
  }

  p {
    font-size: clamp(20px, 3.5vw, 26px);
    color: var(--lightest-slate);
    font-weight: 500;
    line-height: 1.4;
    margin: 0 auto;
    max-width: 800px;
  }
`;

const StyledDecisionsGrid = styled.div`
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 25px;
  margin: 45px 0;

  @media (max-width: 768px) {
    grid-template-columns: 1fr;
    gap: 20px;
  }

  .decision-card {
    background: var(--light-navy);
    border: 1px solid var(--lightest-navy);
    border-radius: var(--border-radius);
    padding: 30px;
    transition: var(--transition);

    &:hover {
      border-color: var(--green);
    }

    h3 {
      font-size: var(--fz-md);
      color: var(--green);
      margin: 0 0 12px 0;
      font-weight: 600;
    }

    p {
      font-size: var(--fz-sm);
      color: var(--slate);
      line-height: 1.5;
      margin: 0;
    }
  }
`;

const StyledFeaturesList = styled.div`
  display: flex;
  flex-direction: column;
  gap: 50px;
  margin: 50px 0;

  .feature-item {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 40px;
    align-items: center;

    @media (max-width: 768px) {
      grid-template-columns: 1fr;
      gap: 20px;
    }

    .feature-content {
      h3 {
        font-size: var(--fz-xl);
        color: var(--white);
        margin: 0 0 15px 0;
        font-weight: 600;
      }
      p {
        font-size: var(--fz-md);
        color: var(--slate);
        line-height: 1.6;
        margin: 0;
      }
    }
  }
`;

const StyledBeforeAfter = styled.div`
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 40px;
  margin: 50px 0;
  border-top: 1px solid var(--lightest-navy);
  padding-top: 40px;

  @media (max-width: 768px) {
    grid-template-columns: 1fr;
    gap: 30px;
  }

  .column {
    background: var(--card-bg);
    border: 1px solid var(--card-border);
    border-radius: var(--border-radius);
    padding: 30px;

    h3 {
      font-size: var(--fz-lg);
      font-weight: 600;
      margin: 0 0 20px 0;
      display: flex;
      align-items: center;
      gap: 10px;
    }

    ul {
      margin: 0;
      padding-left: 20px;
      li {
        font-size: var(--fz-sm);
        margin-bottom: 12px;
        line-height: 1.5;
        color: var(--slate);
      }
    }
  }

  .before-col {
    border-left: 3px solid #ff6b6b;
    h3 {
      color: #ff6b6b;
    }
  }

  .after-col {
    border-left: 3px solid var(--green);
    h3 {
      color: var(--green);
    }
  }
`;

const VectorIllustration = styled.div`
  width: 100%;
  height: 240px;
  background-color: var(--light-navy);
  border: 1px solid var(--lightest-navy);
  border-radius: var(--border-radius);
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  color: var(--slate);
  font-family: var(--font-mono);
  font-size: var(--fz-xs);
  padding: 20px;
  text-align: center;
  position: relative;
  overflow: hidden;

  svg {
    margin-bottom: 15px;
    color: var(--green);
    opacity: 0.8;
  }

  .title {
    color: var(--lightest-slate);
    font-weight: 500;
    margin-bottom: 5px;
  }

  .desc {
    color: var(--slate);
    font-size: 11px;
    max-width: 250px;
  }
`;

const StyledMoreCaseStudies = styled.section`
  width: 100%;
  max-width: 1200px;
  margin: 0 auto;
  padding: 80px 50px;
  border-top: 1px solid var(--lightest-navy);

  @media (max-width: 900px) {
    padding: 60px 25px;
  }

  @media (max-width: 480px) {
    padding: 50px 16px;
  }

  .more-title {
    font-family: var(--font-mono);
    font-size: var(--fz-xs);
    color: var(--green);
    letter-spacing: 2px;
    text-transform: uppercase;
    margin-bottom: 32px;
  }

  .more-grid {
    display: grid;
    grid-template-columns: repeat(2, 1fr);
    gap: 24px;

    @media (max-width: 700px) {
      grid-template-columns: 1fr;
    }
  }

  .more-card {
    display: block;
    text-decoration: none;
    border-radius: 12px;
    overflow: hidden;
    background: var(--light-navy);
    border: 1px solid var(--lightest-navy);
    transition: var(--transition);
    position: relative;
    cursor: pointer;

    &:hover {
      transform: translateY(-6px);
      border-color: var(--green);
      box-shadow: 0 20px 40px -15px rgba(2, 12, 27, 0.8);
    }

    .more-card-img {
      width: 100%;
      aspect-ratio: 16/9;
      object-fit: cover;
      display: block;
      background: var(--lightest-navy);
      transition: transform 0.4s ease;
    }

    &:hover .more-card-img {
      transform: scale(1.04);
    }

    .more-card-body {
      padding: 20px 24px;
    }

    .more-card-label {
      font-family: var(--font-mono);
      font-size: var(--fz-xxs);
      color: var(--green);
      text-transform: uppercase;
      letter-spacing: 1.5px;
      margin-bottom: 8px;
    }

    .more-card-title {
      font-size: var(--fz-xl);
      font-weight: 600;
      color: var(--lightest-slate);
      line-height: 1.2;
      margin: 0;
      transition: color var(--transition);
    }

    &:hover .more-card-title {
      color: var(--green);
    }

    .more-card-arrow {
      position: absolute;
      bottom: 20px;
      right: 24px;
      color: var(--green);
      font-size: 20px;
      opacity: 0;
      transition: opacity 0.2s ease, transform 0.2s ease;
      transform: translateX(-4px);
    }

    &:hover .more-card-arrow {
      opacity: 1;
      transform: translateX(0);
    }
  }
`;

const MarketeqCaseStudy = ({ location }) => {
  const [activeSection, setActiveSection] = useState('');

  useEffect(() => {
    const handleScroll = () => {
      const sections = document.querySelectorAll('#overview, section[id]');
      let current = '';
      sections.forEach(section => {
        const sectionTop = section.offsetTop;
        if (window.scrollY >= sectionTop - 150) {
          current = section.getAttribute('id');
        }
      });
      setActiveSection(current);
    };

    window.addEventListener('scroll', handleScroll);

    if (sr) {
      const fastConfig = delay => ({ ...srConfig(delay), duration: 400 });
      sr.reveal('.banner-reveal', fastConfig(100));
      sr.reveal('.header-details-reveal', fastConfig(150));
      sr.reveal('.toc-reveal', fastConfig(200));
      sr.reveal('section', fastConfig(300));
    }

    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <Layout location={location} hideSocialAndEmail={true}>
      <StyledBanner className="banner-reveal">
        <img src="/uploads/ai-play-default.png" alt="Marketeq Wallet" className="banner-img" />
      </StyledBanner>

      <StyledCaseStudyContainer>
        {/* Sticky Table of Contents */}
        <StyledTOC className="toc-reveal">
          <ul>
            <li>
              <a href="#overview" className={activeSection === 'overview' ? 'active' : ''}>
                Overview
              </a>
            </li>
            <li>
              <a href="#problem" className={activeSection === 'problem' ? 'active' : ''}>
                The Problem
              </a>
            </li>
            <li>
              <a href="#research" className={activeSection === 'research' ? 'active' : ''}>
                Research
              </a>
            </li>
            <li>
              <a href="#design-goal" className={activeSection === 'design-goal' ? 'active' : ''}>
                Design Goal
              </a>
            </li>
            <li>
              <a
                href="#design-exploration"
                className={activeSection === 'design-exploration' ? 'active' : ''}
              >
                Design Exploration
              </a>
            </li>
            <li>
              <a
                href="#final-solution"
                className={activeSection === 'final-solution' ? 'active' : ''}
              >
                Final Solution
              </a>
            </li>
            <li>
              <a href="#impact" className={activeSection === 'impact' ? 'active' : ''}>
                Impact & Takeaways
              </a>
            </li>
            <li>
              <a href="#reflection" className={activeSection === 'reflection' ? 'active' : ''}>
                Reflection
              </a>
            </li>
          </ul>
        </StyledTOC>

        <StyledContentArea>
          <StyledHeaderDetails id="overview" className="header-details-reveal">
            {/* Hero Header */}
            <StyledHero>
              <span className="internship-tag">UX Research & Design Intern</span>
              <h1>Marketeq Wallet</h1>
              <div className="tagline">Dual-currency wallet for B2B consulting teams</div>
              <div className="subtagline">
                From “Wait… do I still have money?” to confident decisions.
              </div>
            </StyledHero>

            {/* Highlights Metrics Grid */}
            <StyledMetricsContainer>
              <MetricCard>
                <div className="value">+45%</div>
                <div className="label">Clearer balance visibility</div>
              </MetricCard>
              <MetricCard>
                <div className="value">-62%</div>
                <div className="label">Fewer duplicate payment attempts</div>
              </MetricCard>
              <MetricCard>
                <div className="value">0→1</div>
                <div className="label">Wallet built from scratch</div>
              </MetricCard>
            </StyledMetricsContainer>

            {/* Metadata Row */}
            <StyledMetadataRow>
              <div className="meta-item">
                <h3>Project Type</h3>
                <p>B2B, IT Consulting, Web Design</p>
              </div>
              <div className="meta-item">
                <h3>Team</h3>
                <p>
                  1 UX Researcher/Designer (Me)
                  <br />2 Engineers, 1 Project Manager
                  <br />1 CEO
                </p>
              </div>
              <div className="meta-item">
                <h3>My Role</h3>
                <p>UX Research & Design Intern</p>
              </div>
              <div className="meta-item">
                <h3>Timeline</h3>
                <p>
                  3 months
                  <br />
                  (Jun – Sep 2025)
                </p>
              </div>
            </StyledMetadataRow>
          </StyledHeaderDetails>

          {/* 1. Overview Section */}
          <StyledSection id="overview-details">
            <h2>Overview</h2>
            <div className="section-subtitle">
              Centralizing balance information across project states and currencies.
            </div>
            <p>
              Marketeq Wallet is a 0→1 desktop web wallet built for clients who manage service
              payments across multiple IT consulting projects. When returning clients couldn't see
              their remaining balance spread across projects, states, and currencies, they paid
              again instead of reusing existing funds, creating unnecessary refunds and operational
              overhead.
            </p>
            <p>
              I led end-to-end UX research and design, reframing the problem from refund delays to
              balance visibility. The result is a centralized wallet that surfaces usable funds by
              currency and project state, with inline USD–TEQ conversion transparency to support
              confident payment decisions.
            </p>
          </StyledSection>

          {/* 2. The Problem Section */}
          <StyledSection id="problem">
            <h2>The Problem</h2>
            <p>
              Before our design intervention, 30% of returning clients paid again instead of reusing
              existing balances. This resulted in a high volume of refund requests and created
              significant operational overhead for the backend support team.
            </p>

            {/* Quick Context Sub-cards */}
            <StyledQuickContext>
              <h3 className="context-title">Quick Context (for non-fintech readers)</h3>
              <div className="context-grid">
                <div className="context-card">
                  <h4>Who are the users?</h4>
                  <p>
                    Operations leads or finance contacts who manage budgets and authorize payments
                    across multiple consulting projects on the platform.
                  </p>
                </div>
                <div className="context-card">
                  <h4>What is TEQ?</h4>
                  <p>
                    TEQ is an internal balance that clients can use to pay for services on the
                    platform, similar to stored credit rather than a public currency.
                  </p>
                </div>
                <div className="context-card">
                  <h4>Why dual-currency?</h4>
                  <p>
                    Due to business and accounting constraints, payments are made in USD while value
                    can be stored and reused as TEQ for future projects.
                  </p>
                </div>
              </div>
            </StyledQuickContext>

            <VectorIllustration>
              <svg
                width="48"
                height="48"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.5"
              >
                <rect x="2" y="5" width="20" height="14" rx="2" ry="2" />
                <line x1="2" y1="10" x2="22" y2="10" />
                <circle cx="6" cy="15" r="1.5" />
                <circle cx="10" cy="15" r="1.5" />
              </svg>
              <div className="title">Problem Concept Map</div>
              <div className="desc">
                Fragmented balance display across multiple projects leading to refund delays and
                repetitive payments.
              </div>
            </VectorIllustration>
          </StyledSection>

          {/* 3. Research Section */}
          <StyledSection id="research">
            <h2>Research</h2>
            <div className="section-subtitle">
              We assumed the problem was refund speed, but wait…
            </div>
            <p>
              Through 5 client interviews and competitive analysis across 20+ platforms, I
              identified key patterns across user behavior and system workflows. The findings
              reframed the problem from refund delays to balance visibility, uncovering its impact
              on decision confidence and repeated payment behavior. I brought this evidence to the
              PM and CEO to shift the project direction.
            </p>
            <p>
              Rather than asking for faster refund processes, users wanted to know if they had
              usable credit in their accounts. We realized that showing remaining balances at
              checkout and in a centralized dashboard would eliminate duplicate payments.
            </p>
          </StyledSection>

          {/* 4. Design Goal Section */}
          <StyledSection id="design-goal">
            <h2>Design Goal</h2>

            {/* HMW Callout */}
            <StyledHMW>
              <span className="hmw-label">How Might We</span>
              <p>
                How might we help clients confidently decide whether to pay again by clearly
                surfacing usable balances across currencies and project states?
              </p>
            </StyledHMW>

            <p>
              Working with the CEO and PM, we prioritized balance visibility as the core problem to
              solve. TEQ incentive features were deferred to a later phase, with the business
              planning to introduce TEQ adoption once the core wallet experience was stable.
            </p>
          </StyledSection>

          {/* 5. Design Exploration Section */}
          <StyledSection id="design-exploration">
            <h2>Design Exploration</h2>
            <div className="section-subtitle">
              Tackling complexity in balance states and currency tracking.
            </div>

            <StyledDecisionsGrid>
              <div className="decision-card">
                <h3>Decision 1: Displaying balances</h3>
                <p>
                  We designed a way to display both USD and TEQ balances in one place, broken down
                  by account state, ensuring they are visually distinct.
                </p>
              </div>
              <div className="decision-card">
                <h3>Decision 2: Tracking project states</h3>
                <p>
                  We mapped USD and TEQ visibility through different project states, indicating
                  locked vs. usable funds clearly.
                </p>
              </div>
              <div className="decision-card">
                <h3>Decision 3: Conversion transparency</h3>
                <p>
                  We designed an inline preview showing exactly what the USD-to-TEQ conversion rate
                  is before clients move funds.
                </p>
              </div>
              <div className="decision-card">
                <h3>Decision 4: Auto-checking health</h3>
                <p>
                  We surfaced project allocation and balance health dynamically, eliminating the
                  need for manual calculations or checks.
                </p>
              </div>
            </StyledDecisionsGrid>
          </StyledSection>

          {/* 6. Final Solution Section */}
          <StyledSection id="final-solution">
            <h2>Final Solution</h2>
            <div className="section-subtitle">
              A unified wallet dashboard designed to centralize balances, conversion tracking, and
              payment actions.
            </div>
            <p>
              The final interface organizes budgets, allocations, and conversions into one clear
              layout. By mapping balance states visually, it allows clients to read available
              balances instantly and avoid redundant checkout actions.
            </p>

            <StyledFeaturesList>
              <div className="feature-item">
                <VectorIllustration>
                  <svg
                    width="48"
                    height="48"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="1.5"
                  >
                    <rect x="3" y="3" width="7" height="9" rx="1" />
                    <rect x="14" y="3" width="7" height="5" rx="1" />
                    <rect x="14" y="12" width="7" height="9" rx="1" />
                    <rect x="3" y="16" width="7" height="5" rx="1" />
                  </svg>
                  <div className="title">Feature 01: Balance Overview</div>
                  <div className="desc">
                    Separate cards for USD, TEQ, and Combined Total to clearly distinguish funds.
                  </div>
                </VectorIllustration>
                <div className="feature-content">
                  <h3>FEATURE 01 — UNIFIED BALANCE OVERVIEW</h3>
                  <p>
                    To make each balance type clear at a glance, USD, TEQ, and the combined total
                    are displayed as separate cards. This prevents clients from confusing the total
                    with what is actually available to spend in each currency. Defining 4 balance
                    states gave clients a shared vocabulary for where their funds were. Visualizing
                    the breakdown as proportions made it easier to read allocation at a glance,
                    without calculating the numbers manually.
                  </p>
                </div>
              </div>

              <div className="feature-item">
                <div className="feature-content">
                  <h3>FEATURE 02 — USD-TEQ CONVERSION PREVIEW</h3>
                  <p>
                    Clients needed confidence in the TEQ rate before committing to a conversion.
                    Surfacing the live rate and historical trend inline gave them the context to
                    make the decision without leaving the page.
                  </p>
                </div>
                <VectorIllustration>
                  <svg
                    width="48"
                    height="48"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="1.5"
                  >
                    <path d="M17 3L21 7L17 11" />
                    <path d="M3 7H21" />
                    <path d="M7 21L3 17L7 13" />
                    <path d="M21 17H3" />
                  </svg>
                  <div className="title">Feature 02: Conversion Calculator</div>
                  <div className="desc">
                    Inline live conversions of USD to TEQ with real-time rate updates.
                  </div>
                </VectorIllustration>
              </div>

              <div className="feature-item">
                <VectorIllustration>
                  <svg
                    width="48"
                    height="48"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="1.5"
                  >
                    <path d="M3 3V21H21" />
                    <path d="M18.7 8l-5.1 5.2-2.8-2.7L7 14.3" />
                  </svg>
                  <div className="title">Feature 03: Allocations & Insights</div>
                  <div className="desc">
                    Health indicators and status summaries for per-project budget tracking.
                  </div>
                </VectorIllustration>
                <div className="feature-content">
                  <h3>FEATURE 03 — PROJECT ALLOCATIONS AND INSIGHTS</h3>
                  <p>
                    Clients needed to know which projects required attention without checking each
                    one individually. Three layers of visibility work together: balance state cards
                    at the top, health badges per project, and a portfolio summary at the bottom.
                  </p>
                </div>
              </div>
            </StyledFeaturesList>

            {/* Before & After Grid */}
            <StyledBeforeAfter>
              <div className="column before-col">
                <h3>Before</h3>
                <ul>
                  <li>Balances were scattered across project pages, emails, and invoices.</li>
                  <li>Clients couldn't tell how much was still usable before checkout.</li>
                  <li>
                    Internal support teams handled frequent refund requests and manual adjustments.
                  </li>
                </ul>
              </div>
              <div className="column after-col">
                <h3>After</h3>
                <ul>
                  <li>Remaining balances are centralized and visible in one place.</li>
                  <li>Clients see what's available before deciding to pay again.</li>
                  <li>Balance clarity reduces confusion across currencies and projects.</li>
                </ul>
              </div>
            </StyledBeforeAfter>
          </StyledSection>

          {/* 7. Impact Section */}
          <StyledSection id="impact">
            <h2>Impact & Takeaways</h2>
            <div className="section-subtitle">
              Validating design decisions through usability studies.
            </div>
            <p>
              I ran a comparative usability study with 8 returning clients, testing identical tasks
              across the existing workflow and the redesigned prototype. The feedback showed that
              the centralized overview removed guesswork and built confidence.
            </p>
            <p>
              <strong>My biggest takeaway:</strong> The most impactful decision was how to present
              and visualize the information users already needed, making balance states readable at
              a glance rather than something to calculate manually.
            </p>
          </StyledSection>

          {/* 8. Reflection Section */}
          <StyledSection id="reflection">
            <h2>Reflection</h2>
            <p>
              Designing a 0→1 product was initially uncomfortable because many assumptions were
              unproven. I learned that clarity doesn't come from having all the answers, it comes
              from asking better questions and staying aligned with the people around you. Working
              closely with the CEO, PM, and engineer taught me how business priorities and technical
              constraints shape design scope, and how early alignment makes iteration faster.
            </p>
            <h3>If I had more time…</h3>
            <ul>
              <li>
                I would track post-launch metrics such as repeat payment rate, refund volume, and
                funding time to validate long-term impact.
              </li>
              <li>
                I would also run more usability testing rounds to iterate and confirm whether the
                design truly matches what users need.
              </li>
              <li>
                I would explore predictive prompts that proactively surface remaining balances
                before checkout.
              </li>
            </ul>
          </StyledSection>
        </StyledContentArea>
      </StyledCaseStudyContainer>

      <StyledMoreCaseStudies>
        <p className="more-title">More Case Study</p>
        <div className="more-grid">
          {[
            {
              title: 'Streamlining Checkout: A Mobile-First Solution to Boost Conversions',
              banner: 'https://res.cloudinary.com/duxol6zvd/image/upload/v1792413397/portfolio/featured/vhg1wcbyfoxtvcjfhp4r.webp',
              url: '/case-study/wework/',
            },
            {
              title: 'Build Voting Feature for Alright TV',
              banner: 'https://res.cloudinary.com/duxol6zvd/image/upload/v1792394001/portfolio/featured/yfsix2cwwuxktohjz6p5.webp',
              url: '/case-study/alright-app/',
            },
          ].map((project, i) => {
            const isInternal = project.url.startsWith('/');
            const cardContent = (
              <>
                <img src={project.banner} alt={project.title} className="more-card-img" />
                <div className="more-card-body">
                  <h3 className="more-card-title">{project.title}</h3>
                </div>
                <span className="more-card-arrow">&#8594;</span>
              </>
            );

            return isInternal ? (
              <Link key={i} to={project.url} className="more-card">
                {cardContent}
              </Link>
            ) : (
              <a
                key={i}
                href={project.url}
                target="_blank"
                rel="noopener noreferrer"
                className="more-card"
              >
                {cardContent}
              </a>
            );
          })}
        </div>
      </StyledMoreCaseStudies>
    </Layout>
  );
};

MarketeqCaseStudy.propTypes = {
  location: PropTypes.object.isRequired,
};

export default MarketeqCaseStudy;
