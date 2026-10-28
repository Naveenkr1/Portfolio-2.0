import React, { useState, useEffect, useRef } from 'react';
import { Link, graphql } from 'gatsby';
import PropTypes from 'prop-types';
import styled from 'styled-components';
import { Layout } from '@components';
import sr from '@utils/sr';
import { srConfig } from '@config';
import { marked } from 'marked';


const StyledCaseStudyContainer = styled.main`
  width: 100%;
  max-width: ${props => (props.$isAILab ? '900px' : '1200px')};
  margin: 0 auto;
  padding: ${props => (props.$isAILab ? '120px 40px 80px' : (props.$hasBanner ? '40px 50px 80px' : '120px 50px 80px'))};
  display: ${props => (props.$isAILab ? 'block' : 'grid')};
  grid-template-columns: 250px 1fr;
  gap: 60px;
  justify-content: center;

  @media (max-width: 900px) {
    grid-template-columns: 1fr;
    padding: ${props => (props.$isAILab ? '90px 24px 60px' : (props.$hasBanner ? '20px 25px 60px' : '100px 25px 60px'))};
    gap: 0;
  }

  @media (max-width: 480px) {
    padding: ${props => (props.$isAILab ? '80px 16px 40px' : (props.$hasBanner ? '15px 16px 40px' : '100px 16px 40px'))};
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

const StyledLightbox = styled.div`
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: rgba(2, 12, 27, 0.98);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 9999;
  cursor: zoom-out;
  padding: 40px;
  backdrop-filter: blur(5px);
  user-select: none;
  touch-action: pan-y;

  @media (max-width: 768px) {
    padding: 20px;
  }

  .lightbox-content {
    position: relative;
    max-width: 90%;
    max-height: 90%;
    display: flex;
    align-items: center;
    justify-content: center;
    cursor: grab;
    will-change: transform, opacity;

    &:active {
      cursor: grabbing;
    }
  }

  img {
    max-width: 100%;
    max-height: 85vh;
    object-fit: contain;
    box-shadow: 0 30px 60px -12px rgba(2, 12, 27, 0.5), 0 18px 36px -18px rgba(2, 12, 27, 0.5);
    border-radius: var(--border-radius);
    pointer-events: none;
    user-select: none;
    -webkit-user-drag: none;
  }

  .close-btn {
    position: fixed;
    top: 30px;
    right: 40px;
    background: transparent;
    border: none;
    color: var(--slate);
    font-size: 40px;
    cursor: pointer;
    transition: var(--transition);
    z-index: 10001;
    line-height: 1;
    padding: 0;

    &:hover {
      color: var(--green);
      transform: rotate(90deg);
    }

    @media (max-width: 768px) {
      top: 20px;
      right: 20px;
      font-size: 34px;
    }
  }

  .carousel-dots {
    position: fixed;
    bottom: 30px;
    left: 50%;
    transform: translateX(-50%);
    display: flex;
    align-items: center;
    gap: 8px;
    background: rgba(17, 34, 64, 0.85);
    padding: 8px 16px;
    border-radius: 20px;
    border: 1px solid rgba(255, 255, 255, 0.1);
    backdrop-filter: blur(8px);
    z-index: 10001;
    box-shadow: 0 10px 30px -10px var(--navy-shadow);

    @media (max-width: 768px) {
      bottom: 24px;
      padding: 6px 12px;
      gap: 6px;
    }

    .dot {
      width: 10px;
      height: 10px;
      border-radius: 50%;
      background: rgba(255, 255, 255, 0.3);
      border: none;
      cursor: pointer;
      padding: 0;
      transition: all 0.3s cubic-bezier(0.645, 0.045, 0.355, 1);
      outline: none;
      position: relative;

      &::after {
        content: '';
        position: absolute;
        top: -8px;
        bottom: -8px;
        left: -6px;
        right: -6px;
      }

      &:hover {
        background: rgba(255, 255, 255, 0.7);
      }

      &.active {
        background: var(--green);
        width: 24px;
        border-radius: 10px;
        box-shadow: 0 0 10px rgba(100, 255, 218, 0.4);
      }
    }
  }
`;

const StyledBanner = styled.div`
  width: 100%;
  max-width: none;
  margin: 0 0 40px 0;
  padding: 100px 0 0 0;
  position: relative;

  img, video {
    width: 100%;
    height: auto;
    max-height: none;
    object-fit: contain;
    border-radius: 0;
    display: block;

    @media (max-width: 900px) {
      height: auto;
    }
  }

  @media (max-width: 900px) {
    padding: 100px 0 0 0;
    margin-top: 0;
    margin-bottom: 24px;
  }

  @media (max-width: 480px) {
    padding: 100px 0 0 0;
    margin-bottom: 20px;
  }
`;

const StyledSidebar = styled.aside`
  position: sticky;
  top: 100px;
  height: calc(100vh - 160px);
  align-self: start;
  display: flex;
  flex-direction: column;
  gap: 30px;
  padding-right: 40px;

  @media (max-width: 1080px) {
    padding-right: 20px;
  }

  @media (max-width: 900px) {
    display: none !important;
  }

  .back-to-top {
    background: transparent;
    border: none;
    color: var(--slate);
    font-family: var(--font-mono);
    font-size: 13px;
    cursor: pointer;
    padding: 0;
    text-align: left;
    width: fit-content;
    transition: var(--transition);
    display: flex;
    align-items: center;
    gap: 8px;
    outline: none;
    margin-top: auto;
    margin-left: -20px;

    &:hover {
      color: var(--green);
    }

    svg {
      width: 14px;
      height: 14px;
      transition: var(--transition);
      transform: rotate(90deg);
    }

    &:hover svg {
      transform: translateY(-3px) rotate(90deg);
    }

    @media (max-width: 900px) {
      display: none;
      margin-left: 0;
    }
  }
`;

const StyledTOCInner = styled.div`
  display: flex;
  flex-direction: column;
  gap: 15px;

  .toc-label {
    display: block;
    font-family: var(--font-sans);
    font-size: var(--fz-sm);
    color: var(--light-slate);
    font-weight: 500;
    margin-bottom: 10px;
    padding-left: 16px;
  }

  ul {
    list-style: none;
    padding: 0;
    margin: 0;

    li {
      margin-bottom: 5px;
      width: 100%;

      a {
        display: flex;
        align-items: center;
        gap: 15px;
        width: 100%;
        color: var(--slate);
        font-family: var(--font-sans);
        font-size: 15px;
        text-decoration: none;
        transition: var(--transition);
        padding: 8px 16px;
        border-radius: 12px;
        font-weight: 500;

        &:hover {
          color: var(--lightest-slate);
        }

        &.active {
          color: var(--lightest-slate);
          background-color: var(--green-tint); /* Pill background */
          
          .toc-number {
            color: var(--green);
            opacity: 1;
          }
        }

        .toc-number {
          font-family: var(--font-mono);
          font-size: 13px;
          color: var(--light-slate);
          opacity: 0.6;
          transition: var(--transition);
        }
      }
    }
  }
`;

const StyledContentArea = styled.div`
  display: flex;
  flex-direction: column;
  margin: 0;
  padding: 0;
  max-width: 800px;

  /* Global styles for Markdown generated content */
  h2 {
    font-size: clamp(22px, 3vw, 28px);
    color: var(--lightest-slate);
    margin-top: 0px;
    margin-bottom: 0px;
    display: flex;
    align-items: center;
    scroll-margin-top: 100px;
    font-weight: 700;
  }

  h3 {
    font-size: clamp(18px, 2vw, 22px);
    color: var(--lightest-slate);
    margin-top: 24px;
    margin-bottom: 8px;
    font-weight: 600;
  }

  p {
    color: var(--slate);
    font-size: 17px;
    margin-top: 8px;
    margin-bottom: 8px;
    line-height: 1.6;
  }

  /* Override padding/margin for pasted ChatGPT/AI interface elements */
  .text-token-text-primary, 
  .text-base.pb-10,
  .text-base.my-auto.mx-auto.pb-10 {
    padding-top: 0px !important;
    padding-bottom: 0px !important;
    margin-top: 0px !important;
    margin-bottom: 0px !important;
  }

  /* Ensure all content inside case study is always fully visible while scrolling */
  #case-study-content {
    width: 100%;
    opacity: 1 !important;
    visibility: visible !important;

    * {
      content-visibility: visible !important;
      contain-intrinsic-size: none !important;
    }

    > * {
      opacity: 1 !important;
      visibility: visible !important;
    }
  }

  ul {
    padding-left: 20px;
    color: var(--slate);
    margin-bottom: 16px;
    li {
      margin-bottom: 8px;
      font-size: 17px;
      line-height: 1.6;
    }
  }

  .grid {
    display: grid !important;
    margin: 40px 0 !important;
    overflow: visible !important;
    max-height: none !important;
    height: auto !important;
    grid-template-rows: auto !important;
    grid-template-areas: none !important;
    grid-auto-rows: auto !important;
  }
  .grid-1 {
    grid-template-columns: 1fr !important;
    grid-template-rows: auto !important;
    overflow: visible !important;
    height: auto !important;
    gap: 0 !important;
  }
  .grid-2 {
    grid-template-columns: 1fr 1fr !important;
    grid-template-rows: auto !important;
    overflow: visible !important;
    height: auto !important;
    gap: 16px !important;
  }
  .grid-3 {
    grid-template-columns: 1fr 1fr 1fr !important;
    grid-template-rows: auto !important;
    overflow: visible !important;
    height: auto !important;
    gap: 16px !important;
  }

  .grid p,
  .image-grid p {
    margin: 0 !important;
    padding: 0 !important;
    width: 100% !important;
    height: auto !important;
    overflow: visible !important;
  }

  .grid img,
  .image-grid img {
    width: 100% !important;
    max-width: 100% !important;
    height: auto !important;
    max-height: none !important;
    object-fit: contain !important;
    margin: 0 auto;
    display: block;
    border-radius: 16px;
  }

  img {
    max-width: 100% !important;
    width: 100% !important;
    height: auto !important;
    max-height: none !important;
    object-fit: contain !important;
    display: block !important;
    margin: ${props => (props.$isAILab ? '0 auto !important' : '40px auto')};
    margin-top: ${props => (props.$isAILab ? '0 !important' : '40px')};
    margin-bottom: ${props => (props.$isAILab ? '0 !important' : '40px')};
    border-radius: 16px;
  }

  /* Metrics Grid */
  .metrics-grid {
    display: grid;
    grid-template-columns: repeat(3, 1fr);
    gap: 20px;
    margin: 40px 0 60px;

    @media (max-width: 600px) {
      grid-template-columns: 1fr;
      gap: 15px;
    }
  }

  .metric-card {
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

    .metric-value {
      font-size: clamp(32px, 5vw, 44px);
      font-weight: 700;
      color: var(--green);
      margin-bottom: 10px;
    }

    .metric-label {
      font-size: var(--fz-sm);
      color: var(--light-slate);
      line-height: 1.4;
      margin: 0;
    }
  }

  .section-eyebrow {
    font-size: 14px;
    color: var(--green);
    margin-bottom: 12px;
    font-weight: 500;
  }

  /* Quick Context Block */
  .quick-context {
    background: var(--light-navy);
    border-left: 3px solid var(--green);
    border-radius: var(--border-radius);
    padding: 35px;
    margin: 40px 0 60px;

    .context-title {
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
  }

  /* HMW Callout */
  .hmw-block {
    background: var(--card-bg);
    border: 1px solid var(--card-border);
    border-radius: var(--border-radius);
    padding: 40px;
    margin: 50px 0;
    text-align: center;

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
  }

  /* Decisions Grid */
  .decisions-grid {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 12px;
    margin: 40px 0;

    @media (max-width: 768px) {
      grid-template-columns: 1fr;
      gap: 20px;
    }

    .decision-card {
      background: var(--light-navy);
      border: 1px solid var(--lightest-navy);
      border-radius: var(--border-radius);
      padding: 16px;
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
  }

  /* CTA Button Block */
  .cta-button-container,
  .ai-lab-cta-container {
    margin: 40px 0 !important;
    width: 100% !important;
    display: flex !important;
    align-items: center !important;
    text-align: left !important;

    .case-study-cta-btn {
      display: inline-flex !important;
      align-items: center !important;
      justify-content: center !important;
      gap: 8px !important;
      text-decoration: none !important;
      font-family: var(--font-mono, monospace) !important;
      font-size: 14px !important;
      font-weight: 500 !important;
      line-height: 1 !important;
      padding: 1.15rem 2.2rem !important;
      white-space: nowrap !important;
      cursor: pointer !important;
      transition: all 0.25s cubic-bezier(0.645, 0.045, 0.355, 1) !important;
      box-shadow: 0 4px 15px rgba(0, 0, 0, 0.2) !important;
      box-sizing: border-box !important;
      max-width: 100% !important;
      width: auto !important;
      border-radius: 4px !important;

      &::before,
      &::after {
        display: none !important;
        content: none !important;
      }

      span {
        white-space: nowrap !important;
        display: inline-block !important;
        line-height: 1 !important;
        flex-shrink: 0 !important;
      }

      svg {
        width: 15px !important;
        height: 15px !important;
        min-width: 15px !important;
        max-width: 15px !important;
        flex-shrink: 0 !important;
        fill: none !important;
        stroke: currentColor !important;
        stroke-width: 2 !important;
        display: inline-block !important;
        vertical-align: middle !important;
        transition: transform 0.2s ease !important;
      }

      &:hover {
        transform: translateY(-2px) !important;
        box-shadow: 0 8px 25px rgba(0, 0, 0, 0.35) !important;

        svg {
          transform: translate(2px, -2px) !important;
        }
      }

      &.btn-outline:hover {
        background-color: var(--green-tint) !important;
      }

      &.btn-filled:hover {
        filter: brightness(1.12) !important;
      }

      &:active {
        transform: translateY(0) !important;
      }
    }
  }

  /* Callout Block (Pro Tips) */
  .callout-block {
    background: var(--light-navy);
    border: 1px solid var(--lightest-navy);
    border-radius: var(--border-radius);
    padding: 30px;
    margin: 40px 0;

    h3 {
      font-size: var(--fz-xl);
      color: var(--white);
      margin: 0 0 20px 0;
      font-weight: 600;
    }

    .callout-content {
      color: var(--slate);
      font-size: var(--fz-lg);
      line-height: 1.6;

      p {
        margin-bottom: 15px;
      }
      p:last-child {
        margin-bottom: 0;
      }

      ul {
        list-style-type: none;
        padding: 0;
        margin: 0;

        li {
          position: relative;
          padding-left: 20px;
          margin-bottom: 15px;

          &::before {
            content: '•';
            position: absolute;
            left: 0;
            color: var(--slate);
          }
        }
      }
    }
  }

  /* Cards Grid */
  .cards-grid {
    display: grid;
    gap: 12px;
    margin: 40px 0;
    overflow: hidden;

    &.cards-grid-2 { grid-template-columns: repeat(2, 1fr); }
    &.cards-grid-3 { grid-template-columns: repeat(3, 1fr); }
    &.cards-grid-4 { grid-template-columns: repeat(4, 1fr); }

    @media (max-width: 900px) {
      &.cards-grid-3, &.cards-grid-4 {
        grid-template-columns: repeat(2, 1fr);
      }
    }
    @media (max-width: 600px) {
      grid-template-columns: 1fr !important;
    }

    .card {
      padding: 16px;
      border: 1px solid var(--lightest-navy);
      border-radius: 12px;
      background: var(--light-navy);
      display: flex;
      flex-direction: column;
      justify-content: center;
      height: 100%;
      box-sizing: border-box;
      
      h3 {
        font-size: 36px;
        color: var(--green);
        margin: 0 0 10px 0;
        font-weight: 700;
        line-height: 1.2;
      }

      p {
        font-size: 16px;
        color: var(--slate);
        margin: 0;
        line-height: 1.5;
      }
    }
  }

  /* Features List */
  .features-list {
    display: flex;
    flex-direction: column;
    gap: 12px;
    margin: 40px 0;

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
  }

  /* Before & After Grid */
  .before-after-grid {
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

    .before-column,
    .after-column {
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

    .before-column {
      border-left: 3px solid #ff6b6b;
      h3 {
        color: #ff6b6b;
      }
    }

    .after-column {
      border-left: 3px solid var(--green);
      h3 {
        color: var(--green);
      }
    }
  }

  /* Vector Illustration / Placeholders */
  .vector-illustration {
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
    margin: 30px 0;

    svg {
      margin-bottom: 15px;
      color: var(--green);
      opacity: 0.8;
    }

    .illustration-title {
      color: var(--lightest-slate);
      font-weight: 500;
      margin-bottom: 5px;
    }

    .illustration-desc {
      color: var(--slate);
      font-size: 11px;
      max-width: 250px;
      margin: 0;
    }
  }
`;

const StyledAILabHeader = styled.header`
  margin-bottom: 50px;
  text-align: left;
  width: 100%;

  .ai-lab-back-link,
  .ai-lab-label {
    display: inline-flex;
    align-items: center;
    gap: 8px;
    color: var(--green);
    font-family: var(--font-mono);
    font-size: 14px;
    font-weight: 400;
    margin-bottom: 10px;
    letter-spacing: 0;
    word-spacing: normal;
    text-transform: uppercase;
    text-decoration: none;
    transition: var(--transition);
    cursor: pointer;
    width: fit-content;

    svg {
      width: 14px;
      height: 14px;
      min-width: 14px;
      max-width: 14px;
      fill: none !important;
      stroke: currentColor !important;
      stroke-width: 2 !important;
      display: inline-block;
      vertical-align: middle;
      transition: transform 0.2s cubic-bezier(0.645, 0.045, 0.355, 1);
    }

    &:hover {
      color: var(--green);

      svg {
        transform: translateX(-4px);
      }
    }
  }

  .ai-lab-title {
    font-size: clamp(28px, 5vw, 48px);
    font-weight: 700;
    color: var(--lightest-slate);
    line-height: 1.15;
    margin: 0 0 0px;
    letter-spacing: -0.5px;
  }

  .ai-lab-subtext {
    color: var(--slate);
    font-size: 20px;
    line-height: 1.6;
    max-width: 760px;
    margin: 12px 0 0 0;
  }

  .ai-lab-labels-row {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    gap: 8px;
    margin: 20px 0 0;
  }

  .ai-lab-pill-label {
    display: inline-flex;
    align-items: center;
    font-family: var(--font-mono);
    font-size: 12px;
    font-weight: 400;
    color: var(--green);
    background: rgba(100, 255, 218, 0.08);
    border: 1px solid rgba(100, 255, 218, 0.25);
    border-radius: 99px;
    padding: 4px 12px;
    white-space: nowrap;
    line-height: 1.4;
    transition: var(--transition);

    &:hover {
      background: rgba(100, 255, 218, 0.15);
      border-color: var(--green);
    }
  }

  .ai-lab-cta-container {
    margin: 24px 0 0;
    text-align: left;
    display: flex;
    align-items: center;

    .case-study-cta-btn {
      display: inline-flex !important;
      align-items: center !important;
      justify-content: center !important;
      gap: 8px !important;
      text-decoration: none !important;
      font-family: var(--font-mono, monospace) !important;
      font-size: 14px !important;
      font-weight: 500 !important;
      line-height: 1 !important;
      padding: 1.15rem 2.2rem !important;
      white-space: nowrap !important;
      cursor: pointer !important;
      transition: all 0.25s cubic-bezier(0.645, 0.045, 0.355, 1) !important;
      box-shadow: 0 4px 15px rgba(0, 0, 0, 0.2) !important;
      box-sizing: border-box !important;
      max-width: 100% !important;
      width: auto !important;
      border-radius: 4px !important;

      &::before,
      &::after {
        display: none !important;
        content: none !important;
      }

      span {
        white-space: nowrap !important;
        display: inline-block !important;
        line-height: 1 !important;
        flex-shrink: 0 !important;
      }

      svg {
        width: 15px !important;
        height: 15px !important;
        min-width: 15px !important;
        max-width: 15px !important;
        flex-shrink: 0 !important;
        fill: none !important;
        stroke: currentColor !important;
        stroke-width: 2 !important;
        display: inline-block !important;
        vertical-align: middle !important;
        transition: transform 0.2s ease !important;
      }

      &:hover {
        transform: translateY(-2px) !important;
        box-shadow: 0 8px 25px rgba(0, 0, 0, 0.35) !important;

        svg {
          transform: translate(2px, -2px) !important;
        }
      }

      &.btn-outline:hover {
        background-color: var(--green-tint) !important;
      }

      &.btn-filled:hover {
        filter: brightness(1.12) !important;
      }

      &:active {
        transform: translateY(0) !important;
      }
    }
  }

  .ai-lab-hero-media {
    margin: 0 !important;
    margin-top: 0 !important;
    margin-bottom: 0 !important;
    width: 100%;
    border-radius: 12px;
    overflow: hidden;
    border: 1px solid var(--card-border);
    background: var(--dark-navy);
    box-shadow: 0 10px 30px -15px var(--navy-shadow);

    img, video {
      width: 100% !important;
      height: auto !important;
      max-height: none !important;
      min-height: auto !important;
      display: block !important;
      margin: 0 !important;
      margin-top: 0 !important;
      margin-bottom: 0 !important;
      padding: 0 !important;
      object-fit: contain !important;
      border-radius: 0 !important;
      cursor: zoom-in;
    }
  }

  @media (max-width: 768px) {
    margin-bottom: 35px;

    .ai-lab-title {
      font-size: clamp(24px, 6vw, 36px);
      margin-bottom: 0px;
    }

    .ai-lab-subtext {
      font-size: clamp(16px, 4vw, 20px);
      line-height: 1.55;
      margin-top: 10px;
    }

    .ai-lab-hero-media {
      margin: 0 !important;
      margin-top: 0 !important;
      margin-bottom: 0 !important;
      border-radius: 8px;
    }
  }
`;

const StyledHero = styled.div`
  display: flex;
  flex-direction: column;
  margin-bottom: 50px;

  .section-eyebrow {
    font-size: 14px;
    color: var(--green);
    margin-bottom: 12px;
    font-weight: 500;
  }

  .internship-tag {
    color: var(--green);
    font-family: var(--font-mono);
    font-size: var(--fz-sm);
    margin-bottom: 15px;
    text-transform: uppercase;
    letter-spacing: 1.5px;
  }

  h1 {
    font-size: clamp(32px, 5vw, 48px);
    color: var(--lightest-slate);
    margin: 0 0 15px 0;
    line-height: 1.1;
    font-weight: 700;
  }

  .summary {
    color: var(--light-slate);
    font-size: 18px;
    line-height: 1.6;
    max-width: 800px;
    margin-bottom: 20px;
  }

  .tagline {
    font-size: 18px;
    line-height: 1.4;
    margin-bottom: 8px;
    color: var(--lightest-slate);
  }

  .subtagline {
    color: var(--slate);
    font-size: 16px;
    line-height: 1.5;
    font-style: italic;
    margin-bottom: 0;
  }
`;

const StyledMetadataRow = styled.div`
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  /* gap: 30px; */
  /* margin-bottom: 80px; */
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
    p,
    div {
      color: var(--light-slate);
      margin: 0;
      font-size: var(--fz-sm);
      line-height: 1.5;
    }
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

const CaseStudyTemplate = ({ data, location }) => {
  const { caseStudy, featuredProjects } = data;

  if (!caseStudy) {
    return (
      <Layout location={location}>
        <div style={{ padding: '100px 0', textAlign: 'center' }}>
          <h2>Case Study not found</h2>
          <p>Please make sure the slug is correct and the server has been updated.</p>
        </div>
      </Layout>
    );
  }

  const {
    title,
    date,
    summary,
    details,
    role,
    results,
    methods,
    banner,
    toc_enabled,
    slug: frontSlug,
    toc_items,
    markdown,
    project_type,
    ai_label,
    labels,
    cta_button,
  } = caseStudy;
  const frontmatter = {
    title,
    date,
    summary,
    details,
    role,
    results,
    methods,
    banner,
    tocEnabled: toc_enabled,
    slug: frontSlug,
    tocItems: toc_items,
    project_type,
    ai_label,
    labels,
    cta_button,
  };
  const html = marked.parse(markdown || '');

  const isAILab = frontmatter.project_type === 'ai-lab' ||
    (location && (location.pathname.includes('/ai-lab') || location.pathname.includes('/ai.lab')));
  const cleanSummary = (frontmatter.summary || '').split(' || ')[0] || frontmatter.summary || '';
  const topCTA = frontmatter.cta_button;

  // Selected Work: filter out project if it links to the current case study, pick 2
  const selectedProjects = (featuredProjects?.edges || [])
    .map(e => e.node)
    .filter(p => {
      const link = (p.cta || p.external || '').trim();
      return frontSlug ? !link.includes(frontSlug) : true;
    })
    .slice(0, 2);

  let processedHtml = html;
  if (isAILab && topCTA && topCTA.enabled) {
    processedHtml = processedHtml.replace(/<div class="cta-button-container"[^>]*>[\s\S]*?<\/div>/gi, '');
  }

  const [activeSection, setActiveSection] = useState('');
  const [lightbox, setLightbox] = useState({ isOpen: false, currentIdx: 0, images: [] });
  const [dragOffset, setDragOffset] = useState(0);
  const [isSwiping, setIsSwiping] = useState(false);
  const dragStartX = useRef(0);
  const dragStartY = useRef(0);
  const dragOffsetRef = useRef(0);
  const isDragging = useRef(false);
  const hasMoved = useRef(false);

  const hasTOC = frontmatter.tocEnabled && frontmatter.tocItems && frontmatter.tocItems.length > 0;

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const openLightbox = (idx, images) => {
    dragOffsetRef.current = 0;
    setDragOffset(0);
    setIsSwiping(false);
    isDragging.current = false;
    hasMoved.current = false;
    setLightbox({ isOpen: true, currentIdx: idx, images });
    document.body.style.overflow = 'hidden';
  };

  const closeLightbox = () => {
    dragOffsetRef.current = 0;
    setDragOffset(0);
    setIsSwiping(false);
    isDragging.current = false;
    hasMoved.current = false;
    setLightbox(prev => ({ ...prev, isOpen: false }));
    document.body.style.overflow = '';
  };

  const nextImage = e => {
    if (e && e.stopPropagation) e.stopPropagation();
    dragOffsetRef.current = 0;
    setDragOffset(0);
    setLightbox(prev => ({
      ...prev,
      currentIdx: (prev.currentIdx + 1) % prev.images.length,
    }));
  };

  const prevImage = e => {
    if (e && e.stopPropagation) e.stopPropagation();
    dragOffsetRef.current = 0;
    setDragOffset(0);
    setLightbox(prev => ({
      ...prev,
      currentIdx: (prev.currentIdx - 1 + prev.images.length) % prev.images.length,
    }));
  };

  const handleTouchStart = e => {
    if (e.touches.length !== 1) return;
    dragStartX.current = e.touches[0].clientX;
    dragStartY.current = e.touches[0].clientY;
    dragOffsetRef.current = 0;
    isDragging.current = true;
    hasMoved.current = false;
    setIsSwiping(true);
  };

  const handleTouchMove = e => {
    if (!isDragging.current || e.touches.length !== 1) return;
    const currentX = e.touches[0].clientX;
    const currentY = e.touches[0].clientY;
    const diffX = currentX - dragStartX.current;
    const diffY = currentY - dragStartY.current;

    if (Math.abs(diffX) > Math.abs(diffY)) {
      if (e.cancelable) e.preventDefault();
      dragOffsetRef.current = diffX;
      setDragOffset(diffX);
      if (Math.abs(diffX) > 8) {
        hasMoved.current = true;
      }
    }
  };

  const handleTouchEnd = () => {
    if (!isDragging.current) return;
    isDragging.current = false;
    setIsSwiping(false);

    const swipeThreshold = 40;
    const offset = dragOffsetRef.current;
    if (offset < -swipeThreshold && lightbox.images.length > 1) {
      nextImage();
    } else if (offset > swipeThreshold && lightbox.images.length > 1) {
      prevImage();
    }
    dragOffsetRef.current = 0;
    setDragOffset(0);
    setTimeout(() => {
      hasMoved.current = false;
    }, 100);
  };

  const handleMouseDown = e => {
    if (e.button !== 0) return;
    dragStartX.current = e.clientX;
    dragStartY.current = e.clientY;
    dragOffsetRef.current = 0;
    isDragging.current = true;
    hasMoved.current = false;
    setIsSwiping(true);
  };

  const handleMouseMove = e => {
    if (!isDragging.current) return;
    const diffX = e.clientX - dragStartX.current;
    dragOffsetRef.current = diffX;
    setDragOffset(diffX);
    if (Math.abs(diffX) > 8) {
      hasMoved.current = true;
    }
  };

  const handleMouseUp = () => {
    if (!isDragging.current) return;
    isDragging.current = false;
    setIsSwiping(false);

    const swipeThreshold = 40;
    const offset = dragOffsetRef.current;
    if (offset < -swipeThreshold && lightbox.images.length > 1) {
      nextImage();
    } else if (offset > swipeThreshold && lightbox.images.length > 1) {
      prevImage();
    }
    dragOffsetRef.current = 0;
    setDragOffset(0);
    setTimeout(() => {
      hasMoved.current = false;
    }, 100);
  };

  const handleBackdropClick = () => {
    if (hasMoved.current) return;
    closeLightbox();
  };

  useEffect(() => {
    const observerOptions = {
      root: null,
      rootMargin: '-10% 0px -80% 0px',
      threshold: 0,
    };

    const handleIntersection = entries => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          setActiveSection(entry.target.id);
        }
      });
    };

    const observer = new IntersectionObserver(handleIntersection, observerOptions);
    const h2Elements = document.querySelectorAll('#case-study-content h2[id]');
    
    // Inject section eyebrows
    h2Elements.forEach((h2) => {
      observer.observe(h2);
      
      // Prevent duplicates in development / React re-renders
      if (h2.previousElementSibling && h2.previousElementSibling.classList.contains('section-eyebrow')) {
        return;
      }
      
      // Only show eyebrow if this heading is in the table of contents
      const tocItems = frontmatter.tocItems || [];
      const tocIndex = tocItems.findIndex(item => item.anchor === h2.id);
      
      if (tocIndex !== -1) {
        const tocItem = tocItems[tocIndex];
        const eyebrow = document.createElement('div');
        eyebrow.className = 'section-eyebrow';
        const num = (tocIndex + 2).toString().padStart(2, '0');
        eyebrow.textContent = `${num}. ${tocItem.text}`;
        
        h2.parentNode.insertBefore(eyebrow, h2);
      }
    });

    const overviewEl = document.getElementById('overview');
    if (overviewEl) observer.observe(overviewEl);

    // Reveal animations for hero/header elements
    if (sr) {
      const fastConfig = delay => ({ ...srConfig(delay), duration: 400 });
      sr.reveal('.banner-reveal', fastConfig(100));
      sr.reveal('.header-details-reveal', fastConfig(150));
      sr.reveal('.toc-reveal', fastConfig(200));
    }

    document.documentElement.style.scrollBehavior = 'smooth';

    return () => {
      h2Elements.forEach(el => observer.unobserve(el));
      const overviewEl = document.getElementById('overview');
      if (overviewEl) observer.unobserve(overviewEl);
      document.documentElement.style.scrollBehavior = 'auto';
    };
  }, [html]);

  useEffect(() => {
    if (!lightbox.isOpen) return;

    const handleKeyDown = e => {
      if (e.key === 'ArrowRight') nextImage();
      if (e.key === 'ArrowLeft') prevImage();
      if (e.key === 'Escape') closeLightbox();
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [lightbox.isOpen]);

  useEffect(() => {
    // Collect all images for the gallery
    const contentImgs = Array.from(document.querySelectorAll('#case-study-content img'));
    const bannerImg = document.querySelector('.banner-img, .ai-lab-hero-media img');
    const allGalleryImages = [];

    const isBannerImage = bannerImg && bannerImg.tagName.toLowerCase() === 'img';

    if (isBannerImage) allGalleryImages.push(bannerImg.src);
    contentImgs.forEach(img => allGalleryImages.push(img.src));

    // Attach listeners
    if (isBannerImage) {
      bannerImg.style.cursor = 'zoom-in';
      bannerImg.onclick = () => openLightbox(0, allGalleryImages);
    }

    contentImgs.forEach((img, i) => {
      img.style.cursor = 'zoom-in';
      const galleryIdx = isBannerImage ? i + 1 : i;
      img.onclick = () => openLightbox(galleryIdx, allGalleryImages);
    });
  }, [html, frontmatter.banner]);

  // Removed old reveal useEffect as it's merged into the main one above

  const isVideoBanner = frontmatter.banner && (
    frontmatter.banner.startsWith('data:video/') ||
    /\.(mp4|webm|ogg|mov|m4v|ogv)($|\?)/i.test(frontmatter.banner) ||
    frontmatter.banner.includes('/video/upload/')
  );

  return (
    <Layout location={location} hideSocialAndEmail={true}>
      {!isAILab && frontmatter.banner && (
        <StyledBanner className="banner-reveal">
          {isVideoBanner ? (
            <video
              src={frontmatter.banner}
              autoPlay
              loop
              muted
              playsInline
              className="banner-img"
            />
          ) : (
            <img
              src={`${frontmatter.banner}${
                frontmatter.banner.includes('?') ? '&' : '?'
              }t=${new Date().getTime()}`}
              alt={frontmatter.title}
              className="banner-img"
            />
          )}
        </StyledBanner>
      )}

      <StyledCaseStudyContainer $hasBanner={!isAILab && !!frontmatter.banner} $isAILab={isAILab}>
        {!isAILab && (
          <StyledSidebar className="toc-reveal">
            {hasTOC && (
              <StyledTOCInner>
                <div className="toc-label">On this page</div>
                <ul>
                  <li>
                    <a href="#overview" className={activeSection === 'overview' ? 'active' : ''}>
                      <span className="toc-number">01</span>
                      Overview
                    </a>
                  </li>
                  {frontmatter.tocItems
                    .filter(item => item.anchor !== 'overview') // prevent duplicate
                    .map((item, idx) => (
                      <li key={idx}>
                        <a
                          href={`#${item.anchor}`}
                          className={activeSection === item.anchor ? 'active' : ''}
                        >
                          <span className="toc-number">{(idx + 2).toString().padStart(2, '0')}</span>
                          {item.text}
                        </a>
                      </li>
                    ))}
                </ul>
              </StyledTOCInner>
            )}
          </StyledSidebar>
        )}

        <StyledContentArea $isAILab={isAILab}>
          {isAILab ? (
            <StyledAILabHeader className="ai-lab-header-reveal">
              {/* 1. AI Label with Back Arrow */}
              <Link to="/ai-lab" className="ai-lab-back-link" title="Back to AI Lab">
                <svg
                  width="14"
                  height="14"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <line x1="19" y1="12" x2="5" y2="12" />
                  <polyline points="12 19 5 12 12 5" />
                </svg>
                <span>{frontmatter.ai_label || 'AI LAB'}</span>
              </Link>

              {/* 2. Title */}
              <h1 className="ai-lab-title">{frontmatter.title}</h1>

              {/* 3. Subtext */}
              {cleanSummary && <p className="ai-lab-subtext">{cleanSummary}</p>}

              {/* 4. Labels in single line */}
              {frontmatter.labels && frontmatter.labels.length > 0 && (
                <div className="ai-lab-labels-row">
                  {frontmatter.labels.map((lbl, idx) => (
                    <span key={idx} className="ai-lab-pill-label">{lbl}</span>
                  ))}
                </div>
              )}

              {/* 5. Optional CTA Button */}
              {topCTA && topCTA.enabled && topCTA.text && (
                <div className="ai-lab-cta-container cta-button-container" style={{ margin: '24px 0 24px', display: 'flex', alignItems: 'center' }}>
                  <a
                    href={topCTA.url || '#'}
                    target="_blank"
                    rel="noopener noreferrer"
                    className={`case-study-cta-btn ${topCTA.styleVariant === 'filled' ? 'btn-filled' : 'btn-outline'}`}
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '8px',
                      padding: '1.15rem 2.2rem',
                      fontFamily: 'var(--font-mono, monospace)',
                      fontSize: '14px',
                      fontWeight: 500,
                      lineHeight: 1,
                      textDecoration: 'none',
                      color: topCTA.styleVariant === 'filled' ? '#0a192f' : (topCTA.color || '#64ffda'),
                      backgroundColor: topCTA.styleVariant === 'filled' ? (topCTA.color || '#64ffda') : 'transparent',
                      border: `1px solid ${topCTA.color || '#64ffda'}`,
                      borderRadius: '4px',
                      cursor: 'pointer',
                      whiteSpace: 'nowrap',
                      width: 'auto',
                      maxWidth: '100%',
                      boxSizing: 'border-box',
                      boxShadow: '0 4px 15px rgba(0, 0, 0, 0.2)',
                      transition: 'all 0.2s cubic-bezier(0.645, 0.045, 0.355, 1)',
                    }}
                  >
                    <span style={{ whiteSpace: 'nowrap', display: 'inline-block', lineHeight: 1, flexShrink: 0 }}>
                      {topCTA.text}
                    </span>
                    <svg
                      width="15"
                      height="15"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      style={{
                        width: '15px',
                        height: '15px',
                        minWidth: '15px',
                        maxWidth: '15px',
                        flexShrink: 0,
                        fill: 'none',
                        stroke: 'currentColor',
                        strokeWidth: 2,
                        verticalAlign: 'middle',
                        display: 'inline-block',
                      }}
                    >
                      <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" />
                      <polyline points="15 3 21 3 21 9" />
                      <line x1="10" y1="14" x2="21" y2="3" />
                    </svg>
                  </a>
                </div>
              )}

              {/* 6. Hero Image / Video */}
              {frontmatter.banner && (
                <div
                  className="ai-lab-hero-media"
                  style={{
                    margin: '0',
                    marginTop: '0',
                    marginBottom: '0',
                    width: '100%',
                  }}
                >
                  {isVideoBanner ? (
                    <video
                      src={frontmatter.banner}
                      autoPlay
                      loop
                      muted
                      playsInline
                      style={{
                        margin: '0',
                        marginTop: '0',
                        marginBottom: '0',
                        padding: '0',
                        width: '100%',
                        height: 'auto',
                        maxHeight: 'none',
                        objectFit: 'contain',
                        display: 'block',
                      }}
                    />
                  ) : (
                    <img
                      src={`${frontmatter.banner}${
                        frontmatter.banner.includes('?') ? '&' : '?'
                      }t=${new Date().getTime()}`}
                      alt={frontmatter.title}
                      style={{
                        margin: '0',
                        marginTop: '0',
                        marginBottom: '0',
                        padding: '0',
                        width: '100%',
                        height: 'auto',
                        maxHeight: 'none',
                        objectFit: 'contain',
                        display: 'block',
                      }}
                    />
                  )}
                </div>
              )}
            </StyledAILabHeader>
          ) : (
            (() => {
              const roleParts = (frontmatter.role || '').split(' || ');
              const myRole = roleParts[0] || '';
              const timeline = roleParts[1] || '';

              const summaryParts = (frontmatter.summary || '').split(' || ');
              const tagline = summaryParts[0] || '';
              const subtagline = summaryParts[1] || '';

              return (
                <StyledHeaderDetails id="overview" className="header-details-reveal">
                  <StyledHero>
                    {hasTOC && <div className="section-eyebrow">01. Overview</div>}
                    {myRole && <span className="internship-tag">{myRole}</span>}
                    <h1>{frontmatter.title}</h1>
                    {tagline && <div className="tagline">{tagline}</div>}
                    {subtagline && <div className="subtagline">{subtagline}</div>}
                  </StyledHero>

                  {frontmatter.details && frontmatter.details.length > 0 ? (
                    <StyledMetadataRow>
                      {frontmatter.details.map((detail, idx) => (
                        <div className="meta-item" key={idx}>
                          <h3>{detail.label}</h3>
                          <p
                            dangerouslySetInnerHTML={{
                              __html: detail.value.replace(/\\n/g, '<br/>'),
                            }}
                          />
                        </div>
                      ))}
                    </StyledMetadataRow>
                  ) : (
                    (frontmatter.role || frontmatter.results || frontmatter.methods) && (
                      <StyledMetadataRow>
                        {frontmatter.results && frontmatter.results !== 'N/A' && (
                          <div className="meta-item">
                            <h3>Project Type</h3>
                            <p>{frontmatter.results}</p>
                          </div>
                        )}
                        {frontmatter.methods && frontmatter.methods !== 'N/A' && (
                          <div className="meta-item">
                            <h3>Team</h3>
                            <p
                              dangerouslySetInnerHTML={{
                                __html: frontmatter.methods.replace(/\\n/g, '<br/>'),
                              }}
                            />
                          </div>
                        )}
                        {myRole && myRole !== 'N/A' && (
                          <div className="meta-item">
                            <h3>My Role</h3>
                            <p>{myRole}</p>
                          </div>
                        )}
                        {timeline && timeline !== 'N/A' && (
                          <div className="meta-item">
                            <h3>Timeline</h3>
                            <p
                              dangerouslySetInnerHTML={{
                                __html: timeline.replace(/\\n/g, '<br/>'),
                              }}
                            />
                          </div>
                        )}
                      </StyledMetadataRow>
                    )
                  )}
                </StyledHeaderDetails>
              );
            })()
          )}

          <div
            id="case-study-content"
            className="content"
            dangerouslySetInnerHTML={{ __html: processedHtml }}
          />
        </StyledContentArea>
      </StyledCaseStudyContainer>

      {!isAILab && selectedProjects && selectedProjects.length > 0 && (
        <StyledMoreCaseStudies>
          <p className="more-title">More Case Study</p>
          <div className="more-grid">
            {selectedProjects.map((project, i) => {
              const rawLink = (project.cta || project.external || '').trim();
              const caseStudyMatch = rawLink.match(
                /^(?:https?:\/\/[^\/]+)?(\/case-study\/[^\/\s]+(?:\/)?.*)$/i
              );
              const projectLink = caseStudyMatch
                ? (caseStudyMatch[1].startsWith('/') ? caseStudyMatch[1] : `/${caseStudyMatch[1]}`)
                : rawLink;
              const isInternal = projectLink.startsWith('/');

              const cardContent = (
                <>
                  {project.cover ? (
                    <img
                      src={project.cover}
                      alt={project.title}
                      className="more-card-img"
                    />
                  ) : (
                    <div
                      className="more-card-img"
                      style={{
                        background: 'var(--lightest-navy)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                      }}
                    />
                  )}
                  <div className="more-card-body">
                    <h3 className="more-card-title">{project.title}</h3>
                  </div>
                  <span className="more-card-arrow">&#8594;</span>
                </>
              );

              return isInternal ? (
                <Link key={i} to={projectLink} className="more-card">
                  {cardContent}
                </Link>
              ) : (
                <a
                  key={i}
                  href={projectLink}
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
      )}

      {lightbox.isOpen && (
        <StyledLightbox
          onClick={handleBackdropClick}
          onTouchStart={handleTouchStart}
          onTouchMove={handleTouchMove}
          onTouchEnd={handleTouchEnd}
          onMouseDown={handleMouseDown}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
          onMouseLeave={handleMouseUp}
        >
          <button
            className="close-btn"
            onClick={closeLightbox}
            onMouseDown={e => e.stopPropagation()}
            onTouchStart={e => e.stopPropagation()}
            aria-label="Close preview"
          >
            &times;
          </button>

          <div
            className="lightbox-content"
            style={{
              transform: `translateX(${dragOffset}px)`,
              transition: isSwiping ? 'none' : 'transform 0.25s cubic-bezier(0.2, 0.8, 0.2, 1)',
              opacity: isSwiping ? Math.max(0.65, 1 - Math.abs(dragOffset) / 700) : 1,
            }}
            onClick={e => e.stopPropagation()}
          >
            <img
              src={lightbox.images[lightbox.currentIdx]}
              alt="Fullscreen preview"
              draggable="false"
            />
          </div>

          {lightbox.images.length > 1 && (
            <div
              className="carousel-dots"
              onClick={e => e.stopPropagation()}
              onMouseDown={e => e.stopPropagation()}
              onTouchStart={e => e.stopPropagation()}
            >
              {lightbox.images.map((_, idx) => (
                <button
                  key={idx}
                  className={`dot ${idx === lightbox.currentIdx ? 'active' : ''}`}
                  onClick={e => {
                    e.stopPropagation();
                    dragOffsetRef.current = 0;
                    setDragOffset(0);
                    setLightbox(prev => ({ ...prev, currentIdx: idx }));
                  }}
                  aria-label={`Go to slide ${idx + 1}`}
                />
              ))}
            </div>
          )}
        </StyledLightbox>
      )}
    </Layout>
  );
};

CaseStudyTemplate.propTypes = {
  data: PropTypes.object.isRequired,
  location: PropTypes.object.isRequired,
};

export default CaseStudyTemplate;

export const pageQuery = graphql`
  query ($slug: String!) {
    caseStudy: mongodbPortfolioCaseStudies(slug: { eq: $slug }) {
      title
      date
      summary
      details {
        label
        value
      }
      role
      results
      methods
      banner
      toc_enabled
      slug
      toc_items {
        text
        anchor
      }
      markdown
      project_type
      ai_label
      labels
      cta_button {
        enabled
        text
        url
        styleVariant
        color
      }
    }
    featuredProjects: allMongodbPortfolioProjects(
      filter: { published: { eq: true } }
      sort: { fields: [date], order: ASC }
    ) {
      edges {
        node {
          title
          cover
          cta
          external
          role
        }
      }
    }
  }
`;
