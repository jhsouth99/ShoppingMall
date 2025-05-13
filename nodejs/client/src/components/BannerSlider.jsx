import React, { useState, useEffect, useCallback, useRef } from 'react';

export default function BannerSlider({ images = [] }) {
  const [current, setCurrent] = useState(0);
  const total = images.length;
  const intervalRef = useRef();

  const next = useCallback(() => setCurrent(i => (i + 1) % total), [total]);
  const prev = useCallback(() => setCurrent(i => (i - 1 + total) % total), [total]);

  useEffect(() => {
    intervalRef.current = setInterval(next, 5000);
    return () => clearInterval(intervalRef.current);
  }, [next]);

  const onDotClick = idx => {
    clearInterval(intervalRef.current);
    setCurrent(idx);
  };

  return (
    <section className="banner-slider">
      
      <div className="slider-wrapper">
        <div class="slide active">
							<div class="custom-banner">
								<div class="gradient-shape"></div>
								<div class="product-boxes">
									<div class="product-box blue">80%</div>
									<div class="product-box purple">80%</div>
									<div class="product-box yellow"></div>
									<div class="product-box white"></div>
								</div>
							</div>
						</div>
						<div class="slide">
							<div class="custom-banner">
								<div class="gradient-shape"></div>
								<div class="product-boxes">
									<div class="product-box blue">70%</div>
									<div class="product-box yellow">60%</div>
								</div>
							</div>
						</div>
						<div class="slide">
							<div class="custom-banner">
								<div class="gradient-shape"></div>
								<div class="product-boxes">
									<div class="product-box purple">50%</div>
									<div class="product-box white"></div>
									<div class="product-box blue">40%</div>
								</div>
							</div>
						</div>
        {images.map((img, i) => (
          <div key={i} className={`slide${i===current?' active':''}`}>
            {img /* src={img.url}… */}
          </div>
        ))}
      </div>
      <button className="slider-control prev" onClick={() => { clearInterval(intervalRef.current); prev(); }}>‹</button>
      <button className="slider-control next" onClick={() => { clearInterval(intervalRef.current); next(); }}>›</button>
      <div className="slider-dots">
        {images.map((_, i) => (
          <span
            key={i}
            className={`dot${i===current?' active':''}`}
            onClick={() => onDotClick(i)}
          />
        ))}
      </div>
    </section>
  );
}
