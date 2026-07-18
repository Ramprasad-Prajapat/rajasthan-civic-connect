import React, { useState, useEffect, useRef } from 'react';

export default function Categories({ setActivePage }) {
  const categoryList = [
    {
      name: 'Garbage',
      description: 'Report garbage not collected, illegal dumping, dustbin overflow and sweeping issue.',
      icon: 'bi bi-trash3-fill',
      badgeClass: 'bg-primary-soft'
    },
    {
      name: 'Street Light',
      description: 'Report street light not working, damaged pole, open wire or dark area.',
      icon: 'bi bi-lightbulb-fill',
      badgeClass: 'bg-secondary-soft'
    },
    {
      name: 'Road / Pothole',
      description: 'Report potholes, broken roads, damaged footpaths and divider issues.',
      icon: 'bi bi-cone-striped',
      badgeClass: 'bg-accent-soft'
    },
    {
      name: 'Water Leakage',
      description: 'Report water leakage, dirty water, low pressure and pipeline damage.',
      icon: 'bi bi-droplet-fill',
      badgeClass: 'bg-primary-soft'
    },
    {
      name: 'Drainage / Sewer',
      description: 'Report drain blockage, sewer overflow, open manhole and bad smell.',
      icon: 'bi bi-funnel-fill',
      badgeClass: 'bg-secondary-soft'
    },
    {
      name: 'Public Toilet',
      description: 'Report dirty toilets, broken doors, water unavailability and cleaning issues.',
      icon: 'bi bi-badge-wc-fill',
      badgeClass: 'bg-accent-soft'
    },
    {
      name: 'Animal Issue',
      description: 'Report stray animals, dead animal pickup and animal rescue issues.',
      icon: 'bi bi-heart-pulse-fill',
      badgeClass: 'bg-primary-soft'
    },
    {
      name: 'Public Property',
      description: 'Report damaged park, broken bench, damaged dustbin and public asset damage.',
      icon: 'bi bi-building-fill',
      badgeClass: 'bg-secondary-soft'
    }
  ];

  const [currentIndex, setCurrentIndex] = useState(0);
  const [itemsPerView, setItemsPerView] = useState(4);
  const [isTransitioning, setIsTransitioning] = useState(true);
  const autoPlayRef = useRef(null);

  // Responsive items count detector
  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth < 576) {
        setItemsPerView(1);
      } else if (window.innerWidth < 992) {
        setItemsPerView(2);
      } else {
        setItemsPerView(4);
      }
    };
    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Clone items to support circular loop
  const extendedList = [...categoryList, ...categoryList.slice(0, itemsPerView)];

  const handleNext = () => {
    if (currentIndex >= categoryList.length) {
      setIsTransitioning(false);
      setCurrentIndex(0);
      setTimeout(() => {
        setIsTransitioning(true);
        setCurrentIndex(1);
      }, 50);
    } else {
      setCurrentIndex(prev => prev + 1);
    }
  };

  const handlePrev = () => {
    if (currentIndex === 0) {
      setIsTransitioning(false);
      setCurrentIndex(categoryList.length);
      setTimeout(() => {
        setIsTransitioning(true);
        setCurrentIndex(categoryList.length - 1);
      }, 50);
    } else {
      setCurrentIndex(prev => prev - 1);
    }
  };

  // Reset auto-play whenever current index changes
  useEffect(() => {
    autoPlayRef.current = setInterval(() => {
      handleNext();
    }, 2500);

    return () => {
      if (autoPlayRef.current) clearInterval(autoPlayRef.current);
    };
  }, [currentIndex, itemsPerView]);

  return (
    <section className="py-5 bg-light" id="complaint">
      <div className="container py-4">
        {/* Section Header */}
        <div className="text-center mb-5">
          <span className="badge bg-secondary-soft text-primary rc-badge mb-2">Service Catalog</span>
          <h2 className="display-6 fw-bold mb-3 text-gradient-primary">Popular Complaint Categories</h2>
          <p className="text-muted mx-auto" style={{ maxWidth: '600px' }}>
            Niche options ke zariye specific departments aur expert workers ko request send karein.
          </p>
        </div>

        {/* Circular Auto-Playing Carousel Wrapper */}
        <div className="position-relative overflow-hidden px-md-5">
          
          {/* Outer track wrapper */}
          <div className="overflow-hidden py-3">
            <div 
              className="d-flex" 
              style={{
                transform: `translateX(-${currentIndex * (100 / itemsPerView)}%)`,
                transition: isTransitioning ? 'transform 0.6s cubic-bezier(0.4, 0, 0.2, 1)' : 'none',
              }}
            >
              {extendedList.map((cat, idx) => (
                <div 
                  className="flex-shrink-0 px-2" 
                  style={{ width: `${100 / itemsPerView}%` }} 
                  key={idx}
                >
                  <div className="card rc-card border-0 p-4 d-flex flex-column h-100 justify-content-between shadow-sm hover-translate-y">
                    <div>
                      <div className={`rc-icon-container ${cat.badgeClass} mx-auto mb-3`}>
                        <i className={cat.icon}></i>
                      </div>
                      <h5 className="fw-bold text-center text-secondary mb-2" style={{ fontSize: '1.05rem' }}>{cat.name}</h5>
                      <p className="text-muted text-center small mb-4" style={{ height: '70px', overflow: 'hidden', lineHeight: '1.5', fontSize: '0.8rem' }}>
                        {cat.description}
                      </p>
                    </div>
                    
                    <div className="text-center">
                      <button 
                        onClick={() => setActivePage && setActivePage('Complaint')}
                        className="btn btn-outline-success w-100 rounded-pill py-2 small fw-semibold" 
                        style={{ fontSize: '0.78rem', border: '2px solid rgba(16, 185, 129, 0.2)' }}
                      >
                        Report {cat.name} <i className="bi bi-arrow-right-short ms-1"></i>
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Navigation Controls */}
          <button 
            type="button"
            onClick={handlePrev} 
            className="btn btn-light rounded-circle shadow position-absolute start-0 top-50 translate-middle-y z-3 d-none d-md-flex align-items-center justify-content-center"
            style={{ width: '42px', height: '42px', border: '1px solid #e2e8f0', left: '10px' }}
          >
            <i className="bi bi-chevron-left fs-5 text-secondary"></i>
          </button>
          
          <button 
            type="button"
            onClick={handleNext} 
            className="btn btn-light rounded-circle shadow position-absolute end-0 top-50 translate-middle-y z-3 d-none d-md-flex align-items-center justify-content-center"
            style={{ width: '42px', height: '42px', border: '1px solid #e2e8f0', right: '10px' }}
          >
            <i className="bi bi-chevron-right fs-5 text-secondary"></i>
          </button>
        </div>

        {/* Carousel Indicators / Dots */}
        <div className="d-flex justify-content-center gap-1.5 mt-4">
          {categoryList.map((_, idx) => {
            const activeDot = currentIndex % categoryList.length === idx;
            return (
              <button
                key={idx}
                type="button"
                onClick={() => {
                  setIsTransitioning(true);
                  setCurrentIndex(idx);
                }}
                className={`rounded-circle border-0 transition-all ${activeDot ? 'bg-success' : 'bg-secondary bg-opacity-25'}`}
                style={{ 
                  width: activeDot ? '24px' : '8px', 
                  height: '8px', 
                  borderRadius: '4px',
                  padding: 0
                }}
              />
            );
          })}
        </div>

      </div>
    </section>
  );
}
