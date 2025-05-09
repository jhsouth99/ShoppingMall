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
