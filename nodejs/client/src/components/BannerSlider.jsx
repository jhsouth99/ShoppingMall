// src/components/BannerSlider.jsx
import React, { useEffect } from 'react';

export default function BannerSlider() {
  useEffect(() => {
    window.initBannerSlider?.();
  }, []);

  return (
    <section className="banner-slider">
      <div className="container">
        <div className="slider-container">
          <div className="slider-wrapper">
            <div className="slide active">
              <div className="custom-banner">
                <div className="gradient-shape"></div>
                <div className="product-boxes">
                  <div className="product-box blue">80%</div>
                  <div className="product-box purple">80%</div>
                  <div className="product-box yellow"></div>
                  <div className="product-box white"></div>
                </div>
              </div>
            </div>
            <div className="slide">
              <div className="custom-banner">
                <div className="gradient-shape"></div>
                <div className="product-boxes">
                  <div className="product-box blue">70%</div>
                  <div className="product-box yellow">60%</div>
                </div>
              </div>
            </div>
            <div className="slide">
              <div className="custom-banner">
                <div className="gradient-shape"></div>
                <div className="product-boxes">
                  <div className="product-box purple">50%</div>
                  <div className="product-box white"></div>
                  <div className="product-box blue">40%</div>
                </div>
              </div>
            </div>
          </div>
          <button className="slider-control prev">&lt;</button>
          <button className="slider-control next">&gt;</button>
          <div className="slider-dots">
            <span className="dot active" data-index="0"></span>
            <span className="dot" data-index="1"></span>
            <span className="dot" data-index="2"></span>
          </div>
        </div>
      </div>
    </section>
  );
}
