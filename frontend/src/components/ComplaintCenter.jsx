import React, { useState, useEffect } from 'react';
import { isFirebaseConfigured, db, firestore } from '../firebase';
import { ref, set, onValue } from 'firebase/database';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { createComplaint, getComplaint, submitFeedback, reopenComplaint, saveComplaintDraft, getComplaintDraft, deleteComplaintDraft } from '../firestoreService';
import MapPicker from './MapPicker';
export default function ComplaintCenter({ setActivePage, showOnlyTrack = false, authenticatedUser = null }) {
  // Page sections: 'submit' (form), 'track' (tracking), 'reopen' (reopen form), 'emergency' (alert)
  const [activeSection, setActiveSection] = useState(showOnlyTrack ? 'track' : 'submit');

  useEffect(() => {
    setActiveSection(showOnlyTrack ? 'track' : 'submit');
  }, [showOnlyTrack]);
  
  // Wizard steps: 1 (Citizen Details), 2 (Location & GPS), 3 (Issue & Category Selection), 4 (Media Proof Upload)
  const [currentStep, setCurrentStep] = useState(1);

  // Rajasthan Location Selection States
  const [ulbData, setUlbData] = useState(null);
  const [sambhags, setSambhags] = useState([]);
  const [districts, setDistricts] = useState([]);
  const [ulbTypes, setUlbTypes] = useState([]);
  const [ulbNames, setUlbNames] = useState([]);
  const [wards, setWards] = useState([]);

  // Submit Form States
  const [formData, setFormData] = useState({
    name: '', mobile: '', email: '',
    sambhag: 'Jaipur Division', district: '', ulbType: '', ulbName: '',
    ward: '', area: '', landmark: '', fullAddress: '',
    category: 'Sewer Overflow', subcategory: 'Road overflow',
    title: '', description: '', photo: null, photoPreview: null, video: null, confirmed: false
  });

  const [isSubmitted, setIsSubmitted] = useState(false);
  const [successDetails, setSuccessDetails] = useState(null);
  const [gpsVerified, setGpsVerified] = useState(false);
  const [showReceipt, setShowReceipt] = useState(false);
  const [loading, setLoading] = useState(false);
  const [submitError, setSubmitError] = useState('');

  // Voice Note Recorder Simulator State
  const [isRecording, setIsRecording] = useState(false);
  const [recordSeconds, setRecordSeconds] = useState(0);

  // Ticking SLA countdown for track details
  const [countdownSeconds, setCountdownSeconds] = useState(21594); // ~6 hours in seconds

  // FAQ Expanded index state
  const [faqIndex, setFaqIndex] = useState(0);

  // Tracking States
  const [trackID, setTrackID] = useState('');
  const [trackingResult, setTrackingResult] = useState(null);
  const [feedbackRating, setFeedbackRating] = useState(5);
  const [feedbackComment, setFeedbackComment] = useState('');
  const [feedbackSubmitted, setFeedbackSubmitted] = useState(false);

  // Reopen States
  const [reopenData, setReopenData] = useState({ id: '', reason: 'Issue not solved', desc: '', photo: null });
  const [reopenSuccess, setReopenSuccess] = useState(false);

  // Custom Searchable Dropdown States
  const [distSearch, setDistSearch] = useState('');
  const [showDistDropdown, setShowDistDropdown] = useState(false);
  const [showAllCategories, setShowAllCategories] = useState(false);

  // Smart Location System States
  const [locationMethod, setLocationMethod] = useState('manual'); // 'manual', 'current', 'map'
  const [locationLoading, setLocationLoading] = useState(false);
  const [locationError, setLocationError] = useState('');
  const [locationSuccess, setLocationSuccess] = useState('');
  const [coordinates, setCoordinates] = useState({ lat: null, lng: null, accuracy: null });
  const [detectedAddress, setDetectedAddress] = useState(null);
  const [locationSource, setLocationSource] = useState('MANUAL_SELECTION');
  const [showMapPicker, setShowMapPicker] = useState(false);
  const [mapCenter, setMapCenter] = useState([26.9124, 75.7873]); // Default: Jaipur
  const [markerPosition, setMarkerPosition] = useState(null);

  // Fetch local Rajasthan ULB master dataset
  useEffect(() => {
    fetch('/data/rajasthan-ulbs.json')
      .then(res => res.json())
      .then(data => {
        setUlbData(data);
        
        // Extract unique districts
        const districtList = [...new Set(data.map(item => item.district))].sort();
        setDistricts(districtList);
        
        if (districtList.length > 0) {
          // Initialize default selection: check for Jaipur first, else first district
          const defaultDist = districtList.includes('Jaipur') ? 'Jaipur' : districtList[0];
          
          // Filter items by selected district
          const distItems = data.filter(item => item.district === defaultDist);
          const types = [...new Set(distItems.map(item => item.ulbType))].sort();
          const defaultType = types[0] || '';
          
          const namesItems = distItems.filter(item => item.ulbType === defaultType);
          const names = namesItems.map(item => item.ulbName).sort();
          const defaultName = names[0] || '';
          
          const matchingUlb = namesItems.find(item => item.ulbName === defaultName);
          const wardList = matchingUlb ? matchingUlb.wards : [];
          const defaultWard = wardList[0] || '';
          
          setFormData(prev => ({
            ...prev,
            district: defaultDist,
            ulbType: defaultType,
            ulbName: defaultName,
            ward: defaultWard,
            sambhag: matchingUlb ? matchingUlb.division : 'Jaipur Division'
          }));

          setUlbTypes(types);
          setUlbNames(names);
          setWards(wardList);
        }
      })
      .catch(err => console.error("Error loading Rajasthan ULB dataset:", err));
  }, []);

  // Auto-fill citizen details from authenticated user
  useEffect(() => {
    if (authenticatedUser) {
      setFormData(prev => ({
        ...prev,
        name: authenticatedUser.fullName || authenticatedUser.name || prev.name,
        email: authenticatedUser.email || prev.email,
        mobile: authenticatedUser.phone || authenticatedUser.mobile || prev.mobile
      }));
    }
  }, [authenticatedUser]);

  // Load Draft Effect
  useEffect(() => {
    const loadDraft = async () => {
      if (showOnlyTrack) return;
      let draftData = null;
      
      // Try local storage first for guest user
      const localDraft = localStorage.getItem('rajcivic_complaint_draft');
      if (localDraft) {
        try {
          draftData = JSON.parse(localDraft);
        } catch (e) {}
      }

      // If authenticated, also try to fetch from backend
      if (authenticatedUser) {
        const backendDraft = await getComplaintDraft();
        if (backendDraft) {
          // Compare updatedAt or just prefer backend if it exists and is newer
          if (!draftData || new Date(backendDraft.updatedAt) > new Date(draftData.updatedAt || 0)) {
            draftData = backendDraft;
          }
        }
      }

      if (draftData && !isSubmitted) {
        setFormData(prev => ({ ...prev, ...draftData.formData }));
        if (draftData.coordinates) setCoordinates(draftData.coordinates);
        if (draftData.detectedAddress) setDetectedAddress(draftData.detectedAddress);
        if (draftData.locationSource) setLocationSource(draftData.locationSource);
        if (draftData.currentStep) setCurrentStep(draftData.currentStep);
      }
    };
    loadDraft();
  }, [authenticatedUser, showOnlyTrack]);

  // Save Draft Effect
  useEffect(() => {
    if (showOnlyTrack || isSubmitted || !formData.category) return;
    
    // Throttle draft saves to avoid excessive writes
    const timer = setTimeout(() => {
      const draftData = {
        formData,
        coordinates,
        detectedAddress,
        locationSource,
        currentStep,
        updatedAt: new Date().toISOString()
      };
      
      localStorage.setItem('rajcivic_complaint_draft', JSON.stringify(draftData));
      
      if (authenticatedUser) {
        saveComplaintDraft(draftData).catch(err => console.error("Failed to sync draft to backend:", err));
      }
    }, 1000);
    
    return () => clearTimeout(timer);
  }, [formData, coordinates, detectedAddress, locationSource, currentStep, authenticatedUser, showOnlyTrack, isSubmitted]);

  // Dropdown dependency Handlers
  const handleDistrictChange = (selectedDist) => {
    if (!ulbData) return;
    const distItems = ulbData.filter(item => item.district === selectedDist);
    const types = [...new Set(distItems.map(item => item.ulbType))].sort();
    const defaultType = types[0] || '';
    
    const namesItems = distItems.filter(item => item.ulbType === defaultType);
    const names = namesItems.map(item => item.ulbName).sort();
    const defaultName = names[0] || '';
    
    const matchingUlb = namesItems.find(item => item.ulbName === defaultName);
    const wardList = matchingUlb ? matchingUlb.wards : [];
    const defaultWard = wardList[0] || '';

    setFormData(prev => ({
      ...prev,
      district: selectedDist,
      ulbType: defaultType,
      ulbName: defaultName,
      ward: defaultWard,
      sambhag: matchingUlb ? matchingUlb.division : prev.sambhag
    }));

    setUlbTypes(types);
    setUlbNames(names);
    setWards(wardList);
  };

  const handleUlbTypeChange = (selectedType) => {
    if (!ulbData) return;
    const distItems = ulbData.filter(item => item.district === formData.district);
    const namesItems = distItems.filter(item => item.ulbType === selectedType);
    const names = namesItems.map(item => item.ulbName).sort();
    const defaultName = names[0] || '';
    
    const matchingUlb = namesItems.find(item => item.ulbName === defaultName);
    const wardList = matchingUlb ? matchingUlb.wards : [];
    const defaultWard = wardList[0] || '';

    setFormData(prev => ({
      ...prev,
      ulbType: selectedType,
      ulbName: defaultName,
      ward: defaultWard,
      sambhag: matchingUlb ? matchingUlb.division : prev.sambhag
    }));

    setUlbNames(names);
    setWards(wardList);
  };

  const handleUlbNameChange = (selectedName) => {
    if (!ulbData) return;
    const matchingUlb = ulbData.find(item => 
      item.district === formData.district && 
      item.ulbType === formData.ulbType && 
      item.ulbName === selectedName
    );
    const wardList = matchingUlb ? matchingUlb.wards : [];
    const defaultWard = wardList[0] || '';

    setFormData(prev => ({
      ...prev,
      ulbName: selectedName,
      ward: defaultWard,
      sambhag: matchingUlb ? matchingUlb.division : prev.sambhag
    }));

    setWards(wardList);
  };

  // SLA ticking countdown effect
  useEffect(() => {
    const timer = setInterval(() => {
      setCountdownSeconds((prev) => (prev > 0 ? prev - 1 : 21594));
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  // Voice note timer simulation
  useEffect(() => {
    let interval;
    if (isRecording) {
      interval = setInterval(() => {
        setRecordSeconds((prev) => {
          if (prev >= 4) {
            setIsRecording(false);
            setFormData((prevForm) => ({
              ...prevForm,
              title: 'Widespread Sewerage Spill',
              description: 'Emergency voice note: Widespread sewer overflow noticed near Gandhi Park, Shastri Nagar. Foul smell spreading across the street and blocking walking corridors.'
            }));
            return 0;
          }
          return prev + 1;
        });
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [isRecording]);

  const triggerVoiceRecord = (e) => {
    e.preventDefault();
    setIsRecording(true);
    setRecordSeconds(0);
  };

  const formatCountdown = (totalSeconds) => {
    const hrs = Math.floor(totalSeconds / 3600);
    const mins = Math.floor((totalSeconds % 3600) / 60);
    const secs = totalSeconds % 60;
    return `${hrs.toString().padStart(2, '0')}h ${mins.toString().padStart(2, '0')}m ${secs.toString().padStart(2, '0')}s`;
  };

  // Category mapping metadata and department auto-routing
  const categoriesMap = {
    'Garbage Collection': {
      dept: 'Sanitation Department', SLA: '24 Hours', priority: 'Medium Priority',
      icon: 'bi-trash3-fill', color: 'text-success bg-primary-soft',
      subs: ['Daily waste pickup', 'Garbage dump clearance', 'Community bin overflow']
    },
    'Water Leakage': {
      dept: 'Water Supply Department', SLA: '12 Hours', priority: 'High Priority',
      icon: 'bi-droplet-fill', color: 'text-danger bg-danger-soft',
      subs: ['Main line leak', 'Service line damage', 'Valve leakage']
    },
    'Water Supply': {
      dept: 'Water Supply Department', SLA: '24 Hours', priority: 'High Priority',
      icon: 'bi-droplet-half', color: 'text-primary bg-secondary-soft',
      subs: ['No water supply', 'Low pressure', 'Contaminated water supply']
    },
    'Sewer Overflow': {
      dept: 'Sewerage Department', SLA: '6 Hours', priority: 'High Priority',
      icon: 'bi-funnel-fill', color: 'text-danger bg-danger-soft',
      subs: ['Road overflow', 'Backflow in house', 'Manhole damage']
    },
    'Drainage Blockage': {
      dept: 'Sewerage Department', SLA: '12 Hours', priority: 'High Priority',
      icon: 'bi-exclamation-octagon-fill', color: 'text-danger bg-danger-soft',
      subs: ['Stormwater drain block', 'Main drain choking', 'Open cover block']
    },
    'Street Light Issue': {
      dept: 'Electrical Department', SLA: '48 Hours', priority: 'Medium Priority',
      icon: 'bi-lightbulb-fill', color: 'text-success bg-primary-soft',
      subs: ['Bulb/LED fused', 'Complete street dark', 'Timer issue']
    },
    'Open Electrical Wire': {
      dept: 'Electrical Department', SLA: '4 Hours', priority: 'High Priority',
      icon: 'bi-lightning-charge-fill', color: 'text-danger bg-danger-soft',
      subs: ['Hanging wires', 'Pole spark', 'Transformer wire open']
    },
    'Road Damage': {
      dept: 'Public Works Department', SLA: '72 Hours', priority: 'Low Priority',
      icon: 'bi-cone-striped', color: 'text-secondary bg-light',
      subs: ['Major cracks', 'Divider broken', 'Footpath damaged']
    },
    'Potholes': {
      dept: 'Public Works Department', SLA: '48 Hours', priority: 'Medium Priority',
      icon: 'bi-signpost-split-fill', color: 'text-warning bg-accent-soft',
      subs: ['Multiple deep potholes', 'Pothole patch sink']
    },
    'Public Toilet Maintenance': {
      dept: 'Sanitation Department', SLA: '12 Hours', priority: 'Medium Priority',
      icon: 'bi-badge-wc-fill', color: 'text-success bg-primary-soft',
      subs: ['Dirty cabins', 'No water supply', 'Light not working']
    },
    'Park Maintenance': {
      dept: 'Public Works Department', SLA: '5 Days', priority: 'Low Priority',
      icon: 'bi-flower1', color: 'text-secondary bg-light',
      subs: ['Broken bench', 'Uncut wild grass', 'Play swings damaged']
    },
    'Encroachment': {
      dept: 'Encroachment Department', SLA: '3 Days', priority: 'Medium Priority',
      icon: 'bi-x-octagon-fill', color: 'text-warning bg-accent-soft',
      subs: ['Footpath shop blockade', 'Illegal parking block', 'Temporary tin shed']
    },
    'Animal Issue': {
      dept: 'Animal Control Department', SLA: '24 Hours', priority: 'Medium Priority',
      icon: 'bi-bug-fill', color: 'text-warning bg-accent-soft',
      subs: ['Stray dog menace', 'Monkey gang threat', 'Stray cattle on road']
    },
    'Tree Damage': {
      dept: 'Forest & Environment Department', SLA: '24 Hours', priority: 'Low Priority',
      icon: 'bi-tree-fill', color: 'text-success bg-primary-soft',
      subs: ['Fallen tree branch', 'Dried unsafe tree', 'Pruning request']
    },
    'Other': {
      dept: 'General Administration', SLA: '48 Hours', priority: 'Low Priority',
      icon: 'bi-grid-fill', color: 'text-secondary bg-light',
      subs: ['General civic concern', 'Unspecified urban issue']
    }
  };

  // Smart Keyword-based auto classification engine
  const autoClassify = (titleText, descText) => {
    const combined = `${titleText || ''} ${descText || ''}`.toLowerCase();
    
    if (combined.includes('sewer') || combined.includes('overflow') || combined.includes('manhole') || combined.includes('gutter')) {
      return { category: 'Sewer Overflow', sub: 'Road overflow' };
    }
    if (combined.includes('drain') || combined.includes('blockage') || combined.includes('choking') || combined.includes('flooding')) {
      return { category: 'Drainage Blockage', sub: 'Stormwater drain block' };
    }
    if (combined.includes('leak') || combined.includes('burst') || combined.includes('pipeline') || combined.includes('valve')) {
      return { category: 'Water Leakage', sub: 'Main line leak' };
    }
    if (combined.includes('water supply') || combined.includes('no water') || combined.includes('dirty water') || combined.includes('contamination')) {
      return { category: 'Water Supply', sub: 'Contaminated water supply' };
    }
    if (combined.includes('toilet') || combined.includes('wc') || combined.includes('public restroom')) {
      return { category: 'Public Toilet Maintenance', sub: 'Dirty cabins' };
    }
    if (combined.includes('garbage') || combined.includes('trash') || combined.includes('dump') || combined.includes('waste') || combined.includes('litter') || combined.includes('dustbin') || combined.includes('bin overflow')) {
      return { category: 'Garbage Collection', sub: 'Garbage dump clearance' };
    }
    if (combined.includes('hanging wire') || combined.includes('spark') || combined.includes('transformer') || combined.includes('electrical wire')) {
      return { category: 'Open Electrical Wire', sub: 'Hanging wires' };
    }
    if (combined.includes('street light') || combined.includes('dark') || combined.includes('fused') || combined.includes('light pole') || combined.includes('bulb')) {
      return { category: 'Street Light Issue', sub: 'Bulb/LED fused' };
    }
    if (combined.includes('pothole') || combined.includes('pot hole') || combined.includes('road crater')) {
      return { category: 'Potholes', sub: 'Multiple deep potholes' };
    }
    if (combined.includes('park') || combined.includes('bench') || combined.includes('wild grass') || combined.includes('swings')) {
      return { category: 'Park Maintenance', sub: 'Play swings damaged' };
    }
    if (combined.includes('road') || combined.includes('crack') || combined.includes('divider') || combined.includes('footpath') || combined.includes('pavement')) {
      return { category: 'Road Damage', sub: 'Major cracks' };
    }
    if (combined.includes('encroach') || combined.includes('illegal shop') || combined.includes('tin shed') || combined.includes('parking block')) {
      return { category: 'Encroachment', sub: 'Footpath shop blockade' };
    }
    if (combined.includes('animal') || combined.includes('dog') || combined.includes('monkey') || combined.includes('cattle') || combined.includes('cow') || combined.includes('stray')) {
      return { category: 'Animal Issue', sub: 'Stray dog menace' };
    }
    if (combined.includes('tree') || combined.includes('branch') || combined.includes('pruning')) {
      return { category: 'Tree Damage', sub: 'Fallen tree branch' };
    }
    return null;
  };

  const handleTitleChange = (val) => {
    setFormData(prev => {
      const updated = { ...prev, title: val };
      const classification = autoClassify(updated.title, updated.description);
      if (classification) {
        updated.category = classification.category;
        updated.subcategory = classification.sub;
      }
      return updated;
    });
  };

  const handleDescriptionChange = (val) => {
    setFormData(prev => {
      const updated = { ...prev, description: val };
      const classification = autoClassify(updated.title, updated.description);
      if (classification) {
        updated.category = classification.category;
        updated.subcategory = classification.sub;
      }
      return updated;
    });
  };

  const stages = [
    { title: 'Submitted', desc: 'Complaint registered' },
    { title: 'Under Review', desc: 'Photos & tags audited' },
    { title: 'Approved', desc: 'ULB validation success' },
    { title: 'Assigned', desc: 'Crew leader allocated' },
    { title: 'Worker On Way', desc: 'GPS route initialized' },
    { title: 'Work Started', desc: 'Physical repair in progress' },
    { title: 'Proof Uploaded', desc: 'Completion photo log received' },
    { title: 'Officer Verification', desc: 'Nodal physical audit' },
    { title: 'Resolved', desc: 'Case marked resolved' },
    { title: 'Citizen Feedback', desc: 'Rating feedback locked' },
    { title: 'Closed', desc: 'Locked from reopening' }
  ];

  // ============================================================
  // SMART LOCATION SYSTEM — Real GPS + Reverse Geocode + Auto-Fill
  // ============================================================

  // Auto-fill district cascade from detected GPS location
  const autoFillFromGPS = (detectedDistrict, area, fullAddr) => {
    if (!districts || districts.length === 0) return;
    
    // Fuzzy match: find best matching district name
    const cleanDetected = detectedDistrict.toLowerCase().replace(/\s+district$/i, '').trim();
    const match = districts.find(d => {
      const cleanD = d.toLowerCase();
      return cleanD === cleanDetected || 
             cleanD.includes(cleanDetected) || 
             cleanDetected.includes(cleanD);
    });

    if (match) {
      handleDistrictChange(match);
      setLocationSuccess(`Location detected! District matched: ${match}`);
    } else {
      setLocationSuccess(`Location detected in Rajasthan. Please verify district selection.`);
    }

    // Auto-fill area and address fields from geocoded data
    setFormData(prev => ({
      ...prev,
      area: area || prev.area,
      fullAddress: fullAddr || prev.fullAddress
    }));
  };

  // Reverse geocode lat/lng using Nominatim (OpenStreetMap free API)
  const reverseGeocode = async (lat, lng) => {
    setLocationError('');
    setLocationSuccess('');
    try {
      const res = await fetch(
        `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&addressdetails=1&accept-language=en`,
        { headers: { 'User-Agent': 'RajCivicConnect/1.0' } }
      );
      const data = await res.json();
      
      const addr = data.address || {};
      const state = addr.state || '';
      const district = addr.state_district || addr.county || '';
      const city = addr.city || addr.town || addr.village || '';
      const area = addr.suburb || addr.neighbourhood || addr.hamlet || '';
      const fullAddress = data.display_name || '';

      const detected = { state, district, city, area, fullAddress };
      setDetectedAddress(detected);

      if (state.toLowerCase().includes('rajasthan')) {
        autoFillFromGPS(district, area, fullAddress);
      } else {
        setLocationError('This service is currently available only for Rajasthan. Detected state: ' + (state || 'Unknown'));
      }
    } catch (err) {
      console.error('Reverse geocode failed:', err);
      setLocationError('Failed to fetch address. Please check your internet connection.');
    }
    setLocationLoading(false);
  };

  // Real browser GPS detection
  const handleUseCurrentLocation = (e) => {
    if (e) e.preventDefault();
    setLocationLoading(true);
    setLocationError('');
    setLocationSuccess('');

    if (!navigator.geolocation) {
      setLocationError('Geolocation is not supported by your browser.');
      setLocationLoading(false);
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const { latitude, longitude, accuracy } = position.coords;
        setCoordinates({ lat: latitude, lng: longitude, accuracy });
        setLocationSource('CURRENT_LOCATION');
        setGpsVerified(true);
        setMapCenter([latitude, longitude]);
        setMarkerPosition([latitude, longitude]);
        setShowMapPicker(true);
        reverseGeocode(latitude, longitude);
      },
      (error) => {
        let msg = 'Location detection failed.';
        switch (error.code) {
          case error.PERMISSION_DENIED:
            msg = 'Location permission denied. Please allow location access in your browser settings.';
            break;
          case error.POSITION_UNAVAILABLE:
            msg = 'Location unavailable. Make sure GPS is enabled on your device.';
            break;
          case error.TIMEOUT:
            msg = 'Location request timed out. Please try again.';
            break;
        }
        setLocationError(msg);
        setLocationLoading(false);
      },
      { enableHighAccuracy: true, timeout: 15000, maximumAge: 0 }
    );
  };

  // Handle map click / marker drag for "Choose on Map" flow
  const handleMapLocationSelect = (lat, lng) => {
    setCoordinates({ lat, lng, accuracy: null });
    setMarkerPosition([lat, lng]);
    setLocationSource('MAP_SELECTION');
    setGpsVerified(true);
    setLocationLoading(true);
    reverseGeocode(lat, lng);
  };

  // Legacy compat alias
  const handleAutoLocation = handleUseCurrentLocation;

  const handlePhotoUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setFormData(prev => ({
          ...prev,
          photo: file,
          photoPreview: reader.result
        }));
      };
      reader.readAsDataURL(file);
    }
  };

  // Dynamic selector values
  const currentCategoryMeta = categoriesMap[formData.category] || categoriesMap['Sewer Overflow'];

  // Handle Form Submission — sends to backend API, receives generated Complaint ID
  const handleSubmit = async (e) => {
    if (e) e.preventDefault();
    if (!formData.confirmed) {
      setSubmitError("Kripya checkbox select karke details confirm karein!");
      return;
    }
    if (!authenticatedUser) {
      setSubmitError("You must be logged in to submit a complaint.");
      if (setActivePage) setActivePage('Login/Register');
      return;
    }
    setLoading(true);
    setSubmitError('');
    
    const userId = authenticatedUser.uid || authenticatedUser.email;
    const citizenName = authenticatedUser.fullName || authenticatedUser.name || formData.name || 'Citizen';
    const citizenPhone = authenticatedUser.phone || authenticatedUser.mobile || formData.mobile || '';

    const complaintData = {
      citizenId: userId,
      citizenName: citizenName,
      citizenPhone: citizenPhone,
      citizenEmail: authenticatedUser.email || formData.email || '',
      sambhag: formData.sambhag,
      district: formData.district,
      ulbType: formData.ulbType,
      ulbName: formData.ulbName,
      wardNumber: formData.ward,
      department: currentCategoryMeta.dept,
      category: formData.category,
      subCategory: formData.subcategory,
      title: formData.title,
      description: formData.description,
      photo: formData.photoPreview || null,
      latitude: coordinates.lat || null,
      longitude: coordinates.lng || null,
      accuracy: coordinates.accuracy || null,
      address: detectedAddress?.fullAddress || formData.fullAddress || '',
      areaColony: formData.area || detectedAddress?.area || '',
      locationSource: locationSource,
      priority: currentCategoryMeta.priority || 'Normal'
    };

    try {
      const result = await createComplaint(complaintData, formData.photo);
      const complaintId = result.complaintId || result.id || 'RJCIVIC-UNKNOWN';
      
      setSuccessDetails({
        id: complaintId,
        category: formData.category,
        subcategory: formData.subcategory,
        sambhag: formData.sambhag,
        district: formData.district,
        ulb: formData.ulbName,
        ward: formData.ward,
        dept: currentCategoryMeta.dept,
        priority: currentCategoryMeta.priority,
        sla: currentCategoryMeta.SLA
      });
      setIsSubmitted(true);

      // Clean up draft
      localStorage.removeItem('rajcivic_complaint_draft');
      if (authenticatedUser) {
        deleteComplaintDraft().catch(err => console.error("Failed to delete backend draft:", err));
      }
    } catch (err) {
      console.error("Complaint submission failed:", err);
      setSubmitError("Failed to submit complaint: " + (err.message || "Please try again."));
    } finally {
      setLoading(false);
    }
  };

  // Handle Tracking Search
  const handleTrackSearch = async (e) => {
    e.preventDefault();
    if (!trackID) return;
    setFeedbackSubmitted(false);
    setLoading(true);
    
    try {
      const result = await getComplaint(trackID);
      if (result) {
        // Map Firestore fields to local UI mapping
        const mappedResult = {
          ...result,
          id: result.id || result.complaintId,
          category: result.category,
          subcategory: result.subcategory || result.subcategoryName,
          title: result.title,
          description: result.description,
          status: result.status,
          date: result.createdAt ? new Date(result.createdAt).toLocaleDateString() : new Date(result.timestamp).toLocaleDateString(),
          time: result.createdAt ? new Date(result.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : new Date(result.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          district: result.district,
          ulb: result.ulbName || result.ulb,
          ward: result.ward,
          dept: result.department,
          officer: result.officer || 'Shri Amit Sharma (Nodal Engineer)',
          worker: result.assignedWorker ? `${result.assignedWorker.name} (Phone: ${result.assignedWorker.phone})` : 'Assigned Worker Pending',
          workerStatus: result.status === 'Resolved' || result.status === 'Closed' ? 'Work completed. Proof submitted.' : 'Work in progress.',
          slaTotal: result.slaDays ? `${result.slaDays * 24} Hours` : '24 Hours',
          slaRemaining: result.status === 'Resolved' || result.status === 'Closed' ? 'Completed within SLA' : 'SLA Active',
          beforeProof: result.beforeProof || result.photo,
          afterProof: result.afterProof,
          officerRemarks: result.remarks || result.officerRemarks || 'No officer comments logged yet.',
          timeline: result.timeline || [],
          activeIdx: result.status === 'Closed' ? 10 : result.status === 'Resolved' ? 9 : result.status === 'InProgress' ? 7 : result.status === 'Assigned' ? 5 : result.status === 'Verified' ? 3 : 1
        };
        setTrackingResult(mappedResult);
        setFeedbackRating(result.rating || 5);
        setFeedbackComment(result.feedback || '');
        if (result.status === 'Closed' || result.rating > 0) {
          setFeedbackSubmitted(true);
        }
      } else {
        alert("Grievance ID not found! Kripya sahi Complaint ID enter karein.");
        setTrackingResult(null);
      }
    } catch (err) {
      console.error("Tracking lookup failed:", err);
    } finally {
      setLoading(false);
    }
  };

  // Handle Reopen Submission
  const handleReopenSubmit = async (e) => {
    e.preventDefault();
    if (!reopenData.id) {
      alert("Kripya valid Complaint ID enter karein!");
      return;
    }
    setLoading(true);
    try {
      await reopenComplaint(reopenData.id, reopenData.reason, reopenData.desc, reopenData.photo);
      setReopenSuccess(true);
    } catch (err) {
      console.error("Reopen submission failed:", err);
      alert("Failed to reopen complaint: " + err.message);
    } finally {
      setLoading(false);
    }
  };

  // Handle Feedback Submission
  const handleFeedbackSubmit = async () => {
    if (!trackingResult) return;
    setLoading(true);
    try {
      const userStr = localStorage.getItem('rajcivic_user');
      const currentUser = userStr ? JSON.parse(userStr) : null;
      const userId = currentUser ? (currentUser.uid || currentUser.email) : 'anonymous';

      await submitFeedback(trackingResult.id, feedbackRating, feedbackComment, userId);
      setFeedbackSubmitted(true);
      setTrackingResult(prev => ({
        ...prev,
        status: 'Closed',
        rating: feedbackRating,
        feedback: feedbackComment,
        activeIdx: 10
      }));
    } catch (err) {
      console.error("Feedback submission failed:", err);
      alert("Failed to submit feedback: " + err.message);
    } finally {
      setLoading(false);
    }
  };

  const faqData = [
    { q: 'Will my personal identity be revealed to the field worker?', a: 'No, citizen mobile numbers and names are completely masked at the ground worker level to protect privacy. Only the Ward Nodal Officer has decryption rights.' },
    { q: 'What happens if my category selection is wrong?', a: 'The system has an intelligent routing override. The receiving Ward Officer can re-route the case to the correct department with a single click, which instantly resets the SLA clock.' },
    { q: 'How does the automatic escalation system work?', a: 'If a high-priority complaint is not resolved within the SLA timer (e.g. 6 hours for sewer overflow), the case automatically escalates to the Municipal Commissioner, sending alert notifications.' },
    { q: 'Can I reopen a closed complaint after officer verification?', a: 'Yes! If the physical repair is unstable or completed poorly, you have a 3-day window post-resolution to upload fresh photos and reopen the case.' }
  ];

  return (
    <section className={`bg-light py-4 ${showOnlyTrack ? '' : 'min-vh-100'}`} id="complaint-center">
      <div className="container">
        
        {/* 1. Complaint Page Header Banner */}
        <div className="card border-0 rounded-4 shadow-sm p-4 mb-4" style={{ background: showOnlyTrack ? 'linear-gradient(135deg, #0d9488 0%, #0f766e 100%)' : 'linear-gradient(135deg, #0f4c81 0%, #1e40af 100%)', color: 'white' }}>
          <div className="row align-items-center g-4 text-start">
            <div className="col-md-8">
              <div className="d-flex align-items-center gap-2 mb-2">
                <span className="badge bg-success text-white rounded-pill px-2.5 py-1 small fw-bold">{showOnlyTrack ? 'LIVE TRACKING PORTAL' : 'CITIZEN GATEWAY'}</span>
                <span className="text-white opacity-75 small">• Nagar Nigam • Nagar Parishad • Nagar Palika</span>
              </div>
              <h2 className="display-6 fw-bold mb-2">{showOnlyTrack ? 'Track Grievance Resolution' : 'Report and Track Civic Complaints'}</h2>
              <p className="opacity-75 small mb-0" style={{ lineHeight: '1.6', maxWidth: '640px' }}>
                {showOnlyTrack 
                  ? 'Enter your unique Rajasthan Civic Complaint ID (e.g. RJCIVIC-JOD-NNJ-2026-0001) to view real-time resolution updates, supervisor details, field crew logs, SLA clocks, and before/after verification photos.'
                  : 'Submit civic issues related to garbage, street lights, roads, water leakage, drainage, public toilets, animal issues and public property damage. RajCivic Connect routes your complaint to the correct ULB, ward, department and officer.'
                }
              </p>
            </div>
            <div className="col-md-4 text-md-end d-flex flex-wrap gap-2 justify-content-start justify-content-md-end">
              {showOnlyTrack ? (
                <button onClick={() => { if (setActivePage) setActivePage('Complaint'); }} className="btn btn-light text-teal px-3 py-2 rounded-3 small fw-bold shadow-sm" style={{ color: '#0f766e' }}>
                  <i className="bi bi-megaphone-fill me-1"></i> Lodge New Complaint
                </button>
              ) : (
                <>
                  <button onClick={() => { setActiveSection('submit'); setIsSubmitted(false); setCurrentStep(1); }} className="btn btn-success text-white px-3 py-2 rounded-3 small fw-bold shadow-sm">
                    <i className="bi bi-megaphone-fill me-1"></i> Submit New Complaint
                  </button>
                  <button onClick={() => { if (setActivePage) { setActivePage('Track Complaint'); } else { setActiveSection('track'); } }} className="btn btn-outline-light px-3 py-2 rounded-3 small fw-bold">
                    <i className="bi bi-search me-1"></i> Track Complaint
                  </button>
                </>
              )}
            </div>
          </div>
        </div>

        {/* 2. Quick Complaint Action Cards (Only shown on standard Complaint Center) */}
        {!showOnlyTrack && (
          <div className="row g-3 mb-4 text-start">
            {[
              { title: 'Report New Complaint', desc: 'Register a new civic issue with geolocations & photos.', icon: 'bi-megaphone', target: 'submit', color: 'border-success hover-success' },
              { title: 'Track Complaint', desc: 'Lookup existing complaint lifecycle & officer remarks.', icon: 'bi-compass', target: 'track', color: 'border-primary hover-primary' },
              { title: 'Reopen Complaint', desc: 'Reopen cases marked completed with fake/unstable proofs.', icon: 'bi-arrow-counterclockwise', target: 'reopen', color: 'border-warning hover-warning' },
              { title: 'Emergency Civic Issue', desc: 'Critical alerts (overflows, leaks, open manholes).', icon: 'bi-exclamation-triangle-fill', target: 'emergency', color: 'border-danger hover-danger' }
            ].map((act, idx) => (
              <div className="col-sm-6 col-lg-3" key={idx}>
                <div 
                  className={`card rc-card border border-light p-3 shadow-sm cursor-pointer h-100 d-flex flex-column justify-content-between ${act.color}`}
                  onClick={() => {
                    if (act.target === 'emergency' && setActivePage) {
                      setActivePage('Emergency');
                    } else if (act.target === 'track' && setActivePage) {
                      setActivePage('Track Complaint');
                    } else {
                      setActiveSection(act.target);
                      if (act.target === 'submit') {
                        setIsSubmitted(false);
                        setCurrentStep(1);
                      }
                    }
                  }}
                  style={{ cursor: 'pointer' }}
                >
                  <div>
                    <div className="rc-icon-container bg-light text-secondary mb-2" style={{ width: '38px', height: '38px', borderRadius: '10px', fontSize: '1.1rem' }}>
                      <i className={`bi ${act.icon}`}></i>
                    </div>
                    <strong className="text-secondary small d-block mb-1">{act.title}</strong>
                    <p className="text-muted small mb-3" style={{ fontSize: '0.7rem', lineHeight: '1.4' }}>
                      {act.desc}
                    </p>
                  </div>
                  <span className="text-success fw-bold small" style={{ fontSize: '0.72rem' }}>
                    Access Desk <i className="bi bi-arrow-right-short"></i>
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Emergency Alert Panel */}
        {activeSection === 'emergency' && (
          <div className="card border border-danger border-opacity-25 rounded-4 p-4 mb-4 text-start shadow-sm animate-slide-up" style={{ background: 'linear-gradient(90deg, rgba(254, 242, 242, 0.6) 0%, rgba(255, 255, 255, 0.95) 100%)' }}>
            <div className="d-flex align-items-start gap-3">
              <div className="bg-danger text-white rounded-circle p-2.5 d-flex align-items-center justify-content-center animate-pulse" style={{ width: '48px', height: '48px' }}>
                <i className="bi bi-exclamation-octagon fs-4"></i>
              </div>
              <div className="flex-grow-1">
                <h5 className="fw-bold text-danger mb-1">Emergency Civic Warning Desk</h5>
                <p className="text-muted small mb-3" style={{ lineHeight: '1.5' }}>
                  Critical municipal breakdowns (Sewer overflows, dangerous open manholes, active dead animal pickups, live water leakage and electrical safety exposures) bypass standard queues. They are automatically marked high-priority and routed to emergency crews.
                </p>
                <button 
                  onClick={() => {
                    if (setActivePage) {
                      setActivePage('Emergency');
                    } else {
                      setActiveSection('submit'); 
                      setCurrentStep(3); 
                      setFormData(prev => ({ ...prev, category: 'Drainage / Sewer', subcategory: 'Open manhole' }));
                    }
                  }} 
                  className="btn btn-danger text-white py-2 px-3 small rounded-3 fw-bold"
                >
                  Open Emergency Quick Form Now
                </button>
              </div>
            </div>
          </div>
        )}

        {/* 3. Submit New Complaint Form View */}
        {activeSection === 'submit' && !isSubmitted && (
          <div className="row g-4 text-start animate-slide-up">
            
            {/* Form Column */}
            <div className="col-lg-8">
              <div className="card border-0 rounded-4 shadow-sm p-4 bg-white">
                
                {/* Modern Step Wizard Indicator Header */}
                <div className="row g-2 mb-4 text-center border-bottom pb-4">
                  {[
                    { nr: 1, label: 'Profile' },
                    { nr: 2, label: 'Location & GPS' },
                    { nr: 3, label: 'Category Selection' },
                    { nr: 4, label: 'Proof Upload' },
                    { nr: 5, label: 'Review & Confirm' }
                  ].map((st, idx) => {
                    const isPassed = currentStep > st.nr;
                    const isCurrent = currentStep === st.nr;
                    return (
                      <div className="col" key={idx}>
                        <div className="d-flex flex-column align-items-center">
                          <div 
                            className={`rounded-circle d-flex align-items-center justify-content-center fw-bold transition-all ${isPassed ? 'bg-success text-white shadow-sm' : isCurrent ? 'bg-primary text-white pulse-glow shadow-sm' : 'bg-light text-muted border'}`}
                            style={{ width: '32px', height: '32px', fontSize: '0.85rem' }}
                          >
                            {isPassed ? <i className="bi bi-check-lg"></i> : st.nr}
                          </div>
                          <span className={`small mt-1 fw-bold ${isCurrent ? 'text-primary' : 'text-muted'}`} style={{ fontSize: '0.68rem' }}>{st.label}</span>
                        </div>
                      </div>
                    );
                  })}
                </div>

                <h5 className="fw-bold text-secondary mb-4">
                  <i className="bi bi-file-earmark-plus-fill text-success me-2"></i>
                  New Civic Case File — Step {currentStep} of 5
                </h5>

                {/* Form Wizard Steps */}
                <form onSubmit={(e) => e.preventDefault()}>
                  
                  {/* STEP 1: CITIZEN PROFILE */}
                  {currentStep === 1 && (
                    <div className="animate-fade-in">
                      <h6 className="fw-bold text-secondary mb-3">1. Citizen Identity Credentials</h6>
                      <div className="row g-3 mb-4">
                        <div className="col-sm-6">
                          <label className="form-label small fw-bold text-secondary">Full Name *</label>
                          <input 
                            type="text" required value={formData.name} 
                            onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                            className="form-control rc-form-control p-3 bg-light border-0 rounded-3 text-secondary" placeholder="Type your full name" 
                          />
                        </div>
                        <div className="col-sm-6">
                          <label className="form-label small fw-bold text-secondary">Mobile Number (Active) *</label>
                          <input 
                            type="tel" required value={formData.mobile} 
                            onChange={(e) => setFormData(prev => ({ ...prev, mobile: e.target.value }))}
                            className="form-control rc-form-control p-3 bg-light border-0 rounded-3 text-secondary" placeholder="Enter active 10-digit mobile" 
                          />
                        </div>
                        <div className="col-sm-12">
                          <label className="form-label small fw-bold text-secondary">Email Address (Optional)</label>
                          <input 
                            type="email" value={formData.email} 
                            onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
                            className="form-control rc-form-control p-3 bg-light border-0 rounded-3 text-secondary" placeholder="yourname@example.com" 
                          />
                        </div>
                      </div>
                      
                      <div className="text-end border-top pt-3">
                        <button 
                          type="button" 
                          disabled={!formData.name || !formData.mobile}
                          onClick={() => setCurrentStep(2)} 
                          className="btn rc-btn-primary px-4 py-2"
                        >
                          Next: Location & GPS <i className="bi bi-chevron-right ms-1"></i>
                        </button>
                      </div>
                    </div>
                  )}

                  {/* STEP 2: SMART LOCATION SYSTEM — Real GPS + Map + Manual */}
                  {currentStep === 2 && (
                    <div className="animate-fade-in">
                      <div className="d-flex justify-content-between align-items-center mb-3">
                        <h6 className="fw-bold text-secondary m-0">2. Smart Location Selection</h6>
                        <span className="badge bg-success-soft text-success border border-success border-opacity-10 py-1 px-2.5 rounded" style={{ fontSize: '0.62rem' }}>
                          <i className="bi bi-broadcast me-1 animate-pulse"></i> Real GPS Enabled
                        </span>
                      </div>

                      {/* Location Method Selector — 3 Premium Buttons */}
                      <div className="row g-2 mb-4">
                        <div className="col-4">
                          <button 
                            type="button"
                            className={`btn w-100 rounded-3 py-3 d-flex flex-column align-items-center gap-1 transition-all border ${
                              locationMethod === 'manual' 
                                ? 'btn-success text-white shadow-sm border-success' 
                                : 'btn-outline-secondary bg-light text-secondary border-light hover-light'
                            }`}
                            onClick={() => { setLocationMethod('manual'); setLocationSource('MANUAL_SELECTION'); setShowMapPicker(false); }}
                          >
                            <i className="bi bi-pencil-square fs-5"></i>
                            <span className="fw-bold" style={{ fontSize: '0.68rem' }}>Manual Entry</span>
                          </button>
                        </div>
                        <div className="col-4">
                          <button 
                            type="button"
                            className={`btn w-100 rounded-3 py-3 d-flex flex-column align-items-center gap-1 transition-all border ${
                              locationMethod === 'current' 
                                ? 'btn-success text-white shadow-sm border-success' 
                                : 'btn-outline-secondary bg-light text-secondary border-light hover-light'
                            }`}
                            onClick={() => { setLocationMethod('current'); handleUseCurrentLocation(); }}
                            disabled={locationLoading}
                          >
                            {locationLoading && locationMethod === 'current' ? (
                              <div className="spinner-border spinner-border-sm text-success" role="status"></div>
                            ) : (
                              <i className="bi bi-crosshair fs-5"></i>
                            )}
                            <span className="fw-bold" style={{ fontSize: '0.68rem' }}>Use GPS</span>
                          </button>
                        </div>
                        <div className="col-4">
                          <button 
                            type="button"
                            className={`btn w-100 rounded-3 py-3 d-flex flex-column align-items-center gap-1 transition-all border ${
                              locationMethod === 'map' 
                                ? 'btn-success text-white shadow-sm border-success' 
                                : 'btn-outline-secondary bg-light text-secondary border-light hover-light'
                            }`}
                            onClick={() => { setLocationMethod('map'); setLocationSource('MAP_SELECTION'); setShowMapPicker(true); }}
                          >
                            <i className="bi bi-map fs-5"></i>
                            <span className="fw-bold" style={{ fontSize: '0.68rem' }}>Choose on Map</span>
                          </button>
                        </div>
                      </div>

                      {/* Loading State */}
                      {locationLoading && (
                        <div className="alert alert-info border-0 p-3 rounded-3 mb-3 d-flex align-items-center gap-2 animate-fade-in">
                          <div className="spinner-grow spinner-grow-sm text-primary" role="status"></div>
                          <span className="text-secondary small fw-bold" style={{ fontSize: '0.72rem' }}>
                            {!detectedAddress ? 'Detecting your location...' : 'Matching with Rajasthan districts...'}
                          </span>
                        </div>
                      )}

                      {/* Error State */}
                      {locationError && (
                        <div className="alert alert-warning border-0 p-3 rounded-3 mb-3 d-flex align-items-start gap-2 animate-fade-in">
                          <i className="bi bi-exclamation-triangle-fill text-warning fs-5"></i>
                          <div>
                            <strong className="text-secondary small d-block">Location Issue</strong>
                            <span className="text-muted" style={{ fontSize: '0.72rem' }}>{locationError}</span>
                          </div>
                        </div>
                      )}

                      {/* Success State */}
                      {locationSuccess && !locationLoading && (
                        <div className="alert alert-success border-0 p-3 rounded-3 mb-3 d-flex align-items-start gap-2 animate-fade-in">
                          <i className="bi bi-patch-check-fill text-success fs-5"></i>
                          <div>
                            <strong className="text-secondary small d-block">{locationSuccess}</strong>
                            {coordinates.lat && (
                              <span className="text-muted font-monospace" style={{ fontSize: '0.65rem' }}>
                                Lat: {coordinates.lat.toFixed(6)}° • Lon: {coordinates.lng.toFixed(6)}°
                                {coordinates.accuracy && ` • Accuracy: ${coordinates.accuracy.toFixed(1)}m`}
                              </span>
                            )}
                          </div>
                        </div>
                      )}

                      {/* Interactive Leaflet Map — shown for GPS and Map modes */}
                      {showMapPicker && (
                        <div className="mb-4 animate-fade-in">
                          <div className="d-flex justify-content-between align-items-center mb-2">
                            <span className="text-muted small fw-bold" style={{ fontSize: '0.72rem' }}>
                              <i className="bi bi-map-fill text-success me-1"></i>
                              {locationMethod === 'map' ? 'Click on map to select location. Drag marker to adjust.' : 'Your detected location:'}
                            </span>
                            <button 
                              type="button" 
                              className="btn btn-outline-secondary btn-sm rounded-pill px-2 py-0"
                              onClick={() => setShowMapPicker(false)}
                              style={{ fontSize: '0.65rem' }}
                            >
                              <i className="bi bi-x-lg"></i> Hide Map
                            </button>
                          </div>
                          <MapPicker
                            center={mapCenter}
                            zoom={14}
                            markerPosition={markerPosition}
                            onLocationSelect={handleMapLocationSelect}
                            height="300px"
                          />
                        </div>
                      )}

                      {/* Detected Address Preview */}
                      {detectedAddress && !locationLoading && (
                        <div className="card border-0 bg-light rounded-3 p-3 mb-4 animate-fade-in">
                          <div className="d-flex align-items-center gap-2 mb-2">
                            <i className="bi bi-geo-alt-fill text-danger"></i>
                            <span className="fw-bold text-secondary small">Detected Address</span>
                          </div>
                          <p className="text-muted small mb-0" style={{ fontSize: '0.74rem', lineHeight: '1.5' }}>
                            {detectedAddress.fullAddress}
                          </p>
                        </div>
                      )}

                      <div className="row g-3 mb-4 animate-fade-in">
                        <div className="col-sm-6 col-md-3 position-relative">
                          <label className="form-label small fw-bold text-secondary">District *</label>
                          
                          {/* Searchable Select Trigger */}
                          <div 
                            className="form-select rc-form-control p-3 bg-light border-0 rounded-3 text-secondary d-flex align-items-center justify-content-between cursor-pointer"
                            onClick={() => setShowDistDropdown(!showDistDropdown)}
                            style={{ cursor: 'pointer', height: '58px' }}
                          >
                            <span className="fw-semibold text-truncate">{formData.district || 'Select District'}</span>
                            <i className="bi bi-chevron-down text-muted small ms-2"></i>
                          </div>

                          {/* Search Dropdown Panel */}
                          {showDistDropdown && (
                            <>
                              {/* Backdrop to close dropdown when clicked outside */}
                              <div 
                                className="position-fixed top-0 start-0 w-100 h-100" 
                                style={{ zIndex: 1000, background: 'transparent' }} 
                                onClick={() => {
                                  setShowDistDropdown(false);
                                  setDistSearch('');
                                }}
                              />
                              
                              <div 
                                className="position-absolute bg-white border rounded-3 shadow-lg p-2 mt-1 w-100 animate-fade-in"
                                style={{ zIndex: 1001, maxHeight: '280px', overflow: 'hidden', display: 'flex', flexDirection: 'column' }}
                              >
                                {/* Search Input */}
                                <div className="input-group input-group-sm mb-2">
                                  <span className="input-group-text bg-light border-0"><i className="bi bi-search text-muted"></i></span>
                                  <input 
                                    type="text"
                                    className="form-control bg-light border-0 focus-success"
                                    placeholder="Search district..."
                                    value={distSearch}
                                    onChange={(e) => setDistSearch(e.target.value)}
                                    autoFocus
                                    style={{ fontSize: '0.8rem' }}
                                  />
                                </div>

                                {/* Scrollable List */}
                                <div 
                                  className="overflow-auto flex-grow-1"
                                  style={{ maxHeight: '200px', overflowY: 'auto' }}
                                >
                                  {districts.filter(d => d.toLowerCase().includes(distSearch.toLowerCase())).length > 0 ? (
                                    districts
                                      .filter(d => d.toLowerCase().includes(distSearch.toLowerCase()))
                                      .map((d, i) => {
                                        const isSelected = formData.district === d;
                                        return (
                                          <button
                                            key={i}
                                            type="button"
                                            className={`btn btn-sm w-100 text-start border-0 py-2 px-3 rounded-2 transition-all d-flex align-items-center justify-content-between ${
                                              isSelected ? 'bg-success text-white fw-bold' : 'hover-light text-secondary bg-transparent'
                                            }`}
                                            onClick={() => {
                                              handleDistrictChange(d);
                                              setShowDistDropdown(false);
                                              setDistSearch('');
                                            }}
                                            style={{ fontSize: '0.88rem' }}
                                          >
                                            <span>{d}</span>
                                            {isSelected && <i className="bi bi-check-lg"></i>}
                                          </button>
                                        );
                                      })
                                  ) : (
                                    <div className="text-center py-3 text-muted small">No districts match search</div>
                                  )}
                                </div>
                              </div>
                            </>
                          )}
                        </div>
                        <div className="col-sm-6 col-md-3">
                          <label className="form-label small fw-bold text-secondary">ULB Type *</label>
                          <select 
                            className="form-select rc-form-control p-3 bg-light border-0 rounded-3 text-secondary" 
                            value={formData.ulbType} 
                            onChange={(e) => handleUlbTypeChange(e.target.value)}
                          >
                            {ulbTypes.map((t, i) => <option key={i} value={t}>{t}</option>)}
                          </select>
                        </div>
                        <div className="col-sm-12 col-md-6">
                          <label className="form-label small fw-bold text-secondary">ULB Name *</label>
                          <select 
                            className="form-select rc-form-control p-3 bg-light border-0 rounded-3 text-secondary" 
                            value={formData.ulbName} 
                            onChange={(e) => handleUlbNameChange(e.target.value)}
                          >
                            {ulbNames.map((n, i) => <option key={i} value={n}>{n}</option>)}
                          </select>
                        </div>
                        <div className="col-sm-4">
                          <label className="form-label small fw-bold text-secondary">Ward Number *</label>
                          <select 
                            className="form-select rc-form-control p-3 bg-light border-0 rounded-3 text-secondary" 
                            value={formData.ward} 
                            onChange={(e) => setFormData(prev => ({ ...prev, ward: e.target.value }))}
                          >
                            {wards.map((w, i) => <option key={i} value={w}>{w}</option>)}
                          </select>
                        </div>
                        <div className="col-sm-8">
                          <label className="form-label small fw-bold text-secondary">Area / Colony *</label>
                          <input type="text" required value={formData.area} onChange={(e) => setFormData(prev => ({ ...prev, area: e.target.value }))} className="form-control rc-form-control p-3 bg-light border-0 rounded-3 text-secondary" placeholder="E.g. Shastri Nagar" />
                        </div>
                        <div className="col-sm-12">
                          <label className="form-label small fw-bold text-secondary">Landmark / Reference *</label>
                          <input type="text" required value={formData.landmark} onChange={(e) => setFormData(prev => ({ ...prev, landmark: e.target.value }))} className="form-control rc-form-control p-3 bg-light border-0 rounded-3 text-secondary" placeholder="Near park, transformer, school, etc." />
                        </div>
                        <div className="col-sm-12">
                          <label className="form-label small fw-bold text-secondary">Full Address Description *</label>
                          <textarea rows="2" required value={formData.fullAddress} onChange={(e) => setFormData(prev => ({ ...prev, fullAddress: e.target.value }))} className="form-control rc-form-control p-3 bg-light border-0 rounded-3 text-secondary" placeholder="Enter complete home/site address details"></textarea>
                        </div>
                      </div>

                      <div className="d-flex justify-content-between border-top pt-3">
                        <button type="button" onClick={() => setCurrentStep(1)} className="btn btn-outline-secondary px-4 py-2 small">
                          <i className="bi bi-chevron-left me-1"></i> Back
                        </button>
                        <button 
                          type="button" 
                          disabled={!formData.area || !formData.fullAddress}
                          onClick={() => setCurrentStep(3)} 
                          className="btn rc-btn-primary px-4 py-2"
                        >
                          Next: Category Selection <i className="bi bi-chevron-right ms-1"></i>
                        </button>
                      </div>
                    </div>
                  )}

                  {/* STEP 3: CATEGORY GRID & LIVE SPEECH RECORDER SIMULATOR */}
                  {currentStep === 3 && (
                    <div className="animate-fade-in">
                      <div className="d-flex justify-content-between align-items-center mb-3">
                        <h6 className="fw-bold text-secondary m-0">3. Category Selection & Voice description</h6>
                        
                        {/* Live voice note speech tool */}
                        <button 
                          onClick={triggerVoiceRecord} 
                          disabled={isRecording}
                          className={`btn ${isRecording ? 'btn-danger animate-pulse' : 'btn-outline-primary'} btn-sm rounded-pill px-3 py-1.5 fw-bold transition-all shadow-sm`}
                        >
                          <i className="bi bi-mic-fill me-1 animate-pulse"></i> 
                          {isRecording ? `Recording voice... 00:0${recordSeconds}s` : 'Record Issue Voice'}
                        </button>
                      </div>

                      {isRecording && (
                        <div className="alert alert-info border-0 p-3 rounded-3 mb-4 d-flex align-items-center gap-2 animate-fade-in">
                          <div className="spinner-grow text-primary spinner-grow-sm" role="status"></div>
                          <span className="text-secondary small fw-bold" style={{ fontSize: '0.68rem' }}>Speech-to-Text active: Speak clearly into your mic...</span>
                        </div>
                      )}

                      {/* Categories Selector grid */}
                      <label className="form-label small fw-bold text-secondary mb-2 d-flex align-items-center justify-content-between">
                        <span>Select Issue Category *</span>
                        <span className="badge bg-success-soft text-success border border-success border-opacity-10 py-1 px-2.5 rounded animate-fade-in" style={{ fontSize: '0.62rem' }}>
                          <i className="bi bi-cpu me-1 animate-pulse"></i> Smart Auto-Routing Enabled
                        </span>
                      </label>
                      <div className="row g-2 mb-4">
                        {(showAllCategories 
                          ? Object.keys(categoriesMap) 
                          : Object.keys(categoriesMap).slice(0, 7)
                        ).map((catName, idx) => {
                          const isSelected = formData.category === catName;
                          const meta = categoriesMap[catName];
                          return (
                            <div className="col-6 col-sm-3 animate-fade-in" key={catName}>
                              <div 
                                className={`card p-2 text-center border cursor-pointer rounded-3 transition-all h-100 d-flex flex-column align-items-center justify-content-center ${isSelected ? 'border-success bg-primary-soft shadow-sm' : 'border-light bg-light hover-light'}`}
                                onClick={() => setFormData(prev => ({
                                  ...prev,
                                  category: catName,
                                  subcategory: meta.subs[0]
                                }))}
                                style={{ cursor: 'pointer', minHeight: '85px' }}
                              >
                                <i className={`bi ${meta.icon} fs-4 ${isSelected ? 'text-success' : 'text-muted'}`}></i>
                                <span className="d-block small mt-1.5 fw-bold text-secondary" style={{ fontSize: '0.62rem', lineHeight: '1.2' }}>{catName}</span>
                              </div>
                            </div>
                          );
                        })}
                        
                        {/* More / Less Toggle Buttons */}
                        {!showAllCategories ? (
                          <div className="col-6 col-sm-3 animate-fade-in" key="more-button">
                            <div 
                              className="card p-2 text-center border cursor-pointer rounded-3 transition-all h-100 d-flex flex-column align-items-center justify-content-center border-primary bg-primary-soft hover-light"
                              onClick={() => setShowAllCategories(true)}
                              style={{ cursor: 'pointer', minHeight: '85px' }}
                            >
                              <i className="bi bi-grid-3x3-gap-fill fs-4 text-primary animate-pulse"></i>
                              <span className="d-block small mt-1.5 fw-bold text-primary" style={{ fontSize: '0.62rem', lineHeight: '1.2' }}>More Categories</span>
                            </div>
                          </div>
                        ) : (
                          <div className="col-6 col-sm-3 animate-fade-in" key="less-button">
                            <div 
                              className="card p-2 text-center border cursor-pointer rounded-3 transition-all h-100 d-flex flex-column align-items-center justify-content-center border-secondary bg-light hover-light"
                              onClick={() => setShowAllCategories(false)}
                              style={{ cursor: 'pointer', minHeight: '85px' }}
                            >
                              <i className="bi bi-chevron-up fs-4 text-secondary"></i>
                              <span className="d-block small mt-1.5 fw-bold text-secondary" style={{ fontSize: '0.62rem', lineHeight: '1.2' }}>Show Less</span>
                            </div>
                          </div>
                        )}
                      </div>

                      <div className="row g-3 mb-4">
                        <div className="col-sm-6 text-start">
                          <label className="form-label small fw-bold text-secondary">Category Mapped *</label>
                          <input type="text" disabled value={formData.category} className="form-control p-3 bg-light border-0 rounded-3 text-secondary fw-semibold" />
                        </div>
                        <div className="col-sm-6">
                          <label className="form-label small fw-bold text-secondary">Subcategory *</label>
                          <select 
                            className="form-select rc-form-control p-3 bg-light border-0 rounded-3 text-secondary" 
                            value={formData.subcategory} 
                            onChange={(e) => setFormData(prev => ({ ...prev, subcategory: e.target.value }))}
                          >
                            {(categoriesMap[formData.category]?.subs || []).map((sub, idx) => (
                              <option value={sub} key={idx}>{sub}</option>
                            ))}
                          </select>
                        </div>
                        <div className="col-sm-12 animate-fade-in">
                          <label className="form-label small fw-bold text-secondary d-flex justify-content-between align-items-center">
                            <span>Complaint Title *</span>
                            <span className="text-muted text-xxs" style={{ fontSize: '0.6rem' }}>Type keywords to auto-classify</span>
                          </label>
                          <input 
                            type="text" required value={formData.title} 
                            onChange={(e) => handleTitleChange(e.target.value)}
                            className="form-control rc-form-control p-3 bg-light border-0 rounded-3 text-secondary focus-success" placeholder="Short title: e.g. Sewer leakage over road" 
                          />
                        </div>
                        <div className="col-sm-12 animate-fade-in">
                          <label className="form-label small fw-bold text-secondary d-flex justify-content-between align-items-center">
                            <span>Complaint Description *</span>
                            <span className="text-muted text-xxs" style={{ fontSize: '0.6rem' }}>Add details for advanced classification</span>
                          </label>
                          <textarea 
                            rows="3" required value={formData.description} 
                            onChange={(e) => handleDescriptionChange(e.target.value)}
                            className="form-control rc-form-control p-3 bg-light border-0 rounded-3 text-secondary focus-success" placeholder="Explain details, landmarks, or delay info"
                          ></textarea>
                        </div>
                      </div>

                      <div className="d-flex justify-content-between border-top pt-3">
                        <button type="button" onClick={() => setCurrentStep(2)} className="btn btn-outline-secondary px-4 py-2 small">
                          <i className="bi bi-chevron-left me-1"></i> Back
                        </button>
                        <button 
                          type="button" 
                          disabled={!formData.title || !formData.description}
                          onClick={() => setCurrentStep(4)} 
                          className="btn rc-btn-primary px-4 py-2"
                        >
                          Next: Upload Proof <i className="bi bi-chevron-right ms-1"></i>
                        </button>
                      </div>
                    </div>
                  )}

                  {/* STEP 4: DRAG AND DROP PHOTO WITH LIVE PREVIEW */}
                  {currentStep === 4 && (
                    <div className="animate-fade-in">
                      <h6 className="fw-bold text-secondary mb-3">4. Media Uploads & Confirm Submission</h6>
                      
                      <div className="row g-3 mb-4">
                        <div className="col-sm-6 text-start">
                          <label className="form-label small fw-bold text-secondary">Upload Issue Photo *</label>
                          <div className="border border-dashed border-2 rounded-3 p-4 text-center bg-light transition-all position-relative hover-light" style={{ minHeight: '190px' }}>
                            {formData.photoPreview ? (
                              <div className="position-relative d-inline-block">
                                <img src={formData.photoPreview} alt="Preview" className="img-thumbnail rounded-3 shadow-sm mb-2" style={{ maxHeight: '100px' }} />
                                <strong className="text-secondary small d-block" style={{ fontSize: '0.62rem' }}>Proof Photo Captured! Ready.</strong>
                                <button type="button" onClick={() => setFormData(prev => ({ ...prev, photo: null, photoPreview: null }))} className="btn btn-danger btn-xs position-absolute top-0 end-0 rounded-circle" style={{ padding: '0px 6px' }}>&times;</button>
                              </div>
                            ) : (
                              <>
                                <i className="bi bi-cloud-arrow-up display-6 text-success animate-pulse d-block mb-1"></i>
                                <span className="d-block text-secondary small fw-bold" style={{ fontSize: '0.72rem' }}>Drag & Drop photo here</span>
                                <span className="text-muted d-block text-xxs mb-2" style={{ fontSize: '0.62rem' }}>Max file size limit: 5MB</span>
                                <input type="file" required onChange={handlePhotoUpload} className="form-control form-control-sm mt-2" accept="image/*" />
                              </>
                            )}
                          </div>
                        </div>
                        <div className="col-sm-6 text-start">
                          <label className="form-label small fw-bold text-secondary">Upload Issue Video (Optional)</label>
                          <div className="border border-dashed border-2 rounded-3 p-4 text-center bg-light transition-all hover-light" style={{ minHeight: '190px' }}>
                            <i className="bi bi-camera-video display-6 text-muted d-block mb-1"></i>
                            <span className="d-block text-secondary small fw-bold" style={{ fontSize: '0.72rem' }}>Drag & Drop video here</span>
                            <span className="text-muted d-block text-xxs mb-2" style={{ fontSize: '0.62rem' }}>Max file size limit: 15MB</span>
                            <input type="file" className="form-control form-control-sm mt-2" accept="video/*" />
                          </div>
                        </div>
                      </div>

                      {/* Duplicate Hint and Checkbox */}
                      <div className="alert alert-warning border-0 p-3 rounded-3 mb-4 d-flex align-items-start gap-2">
                        <i className="bi bi-info-circle-fill text-warning fs-5"></i>
                        <p className="m-0 text-muted small" style={{ fontSize: '0.7rem', lineHeight: '1.4' }}>
                          <strong>Duplicate Complaint Check:</strong> By verifying, the system performs a localized search against open tasks inside {formData.area || 'your area'} to prevent overlapping dispatcher queue logs.
                        </p>
                      </div>

                      <div className="d-flex justify-content-between border-top pt-3">
                        <button type="button" onClick={() => setCurrentStep(3)} className="btn btn-outline-secondary px-4 py-2 small">
                          <i className="bi bi-chevron-left me-1"></i> Back
                        </button>
                        <button 
                          type="button" 
                          disabled={!formData.photoPreview}
                          onClick={() => {
                            if (!authenticatedUser) {
                              setSubmitError("Login Required To Submit Complaint");
                              if (setActivePage) {
                                // App.jsx route protection logic will save the activePage state
                                setActivePage('Login/Register');
                              }
                              return;
                            }
                            setCurrentStep(5);
                          }} 
                          className="btn rc-btn-primary px-4 py-2"
                        >
                          Next: Review & Confirm <i className="bi bi-chevron-right ms-1"></i>
                        </button>
                      </div>
                    </div>
                  )}

                  {/* STEP 5: REVIEW & CONFIRM */}
                  {currentStep === 5 && (
                    <div className="animate-fade-in">
                      <h6 className="fw-bold text-secondary mb-3">5. Review Your Complaint Before Submission</h6>
                      <p className="text-muted small mb-4" style={{ fontSize: '0.72rem' }}>
                        Please review all details carefully. Click "Edit" on any section to go back and make changes.
                      </p>

                      {submitError && (
                        <div className="alert alert-danger border-0 rounded-3 p-3 mb-3 d-flex align-items-center gap-2 animate-fade-in">
                          <i className="bi bi-exclamation-triangle-fill text-danger"></i>
                          <span className="text-danger small">{submitError}</span>
                        </div>
                      )}

                      {/* Citizen Profile Summary */}
                      <div className="card border rounded-3 p-3 mb-3 bg-light">
                        <div className="d-flex justify-content-between align-items-center mb-2">
                          <strong className="text-secondary small"><i className="bi bi-person-fill text-success me-1"></i> Citizen Profile</strong>
                          <button type="button" onClick={() => setCurrentStep(1)} className="btn btn-outline-primary btn-sm rounded-pill px-2.5 py-0.5" style={{ fontSize: '0.62rem' }}>
                            <i className="bi bi-pencil-fill me-1"></i>Edit
                          </button>
                        </div>
                        <div className="row g-1 small text-muted" style={{ fontSize: '0.74rem' }}>
                          <div className="col-4"><span className="d-block text-muted">Name:</span><strong className="text-secondary">{formData.name || '—'}</strong></div>
                          <div className="col-4"><span className="d-block text-muted">Mobile:</span><strong className="text-secondary">{formData.mobile || '—'}</strong></div>
                          <div className="col-4"><span className="d-block text-muted">Email:</span><strong className="text-secondary">{formData.email || '—'}</strong></div>
                        </div>
                      </div>

                      {/* Location Summary */}
                      <div className="card border rounded-3 p-3 mb-3 bg-light">
                        <div className="d-flex justify-content-between align-items-center mb-2">
                          <strong className="text-secondary small"><i className="bi bi-geo-alt-fill text-success me-1"></i> Location</strong>
                          <button type="button" onClick={() => setCurrentStep(2)} className="btn btn-outline-primary btn-sm rounded-pill px-2.5 py-0.5" style={{ fontSize: '0.62rem' }}>
                            <i className="bi bi-pencil-fill me-1"></i>Edit
                          </button>
                        </div>
                        <div className="row g-1 small text-muted" style={{ fontSize: '0.74rem' }}>
                          <div className="col-4"><span className="d-block text-muted">District:</span><strong className="text-secondary">{formData.district || '—'}</strong></div>
                          <div className="col-4"><span className="d-block text-muted">ULB Type:</span><strong className="text-secondary">{formData.ulbType || '—'}</strong></div>
                          <div className="col-4"><span className="d-block text-muted">ULB Name:</span><strong className="text-secondary">{formData.ulbName || '—'}</strong></div>
                          <div className="col-4"><span className="d-block text-muted">Ward:</span><strong className="text-secondary">{formData.ward || '—'}</strong></div>
                          <div className="col-4"><span className="d-block text-muted">Area:</span><strong className="text-secondary">{formData.area || '—'}</strong></div>
                          <div className="col-4"><span className="d-block text-muted">GPS:</span><strong className="text-secondary">{coordinates.lat ? `${coordinates.lat.toFixed(4)}, ${coordinates.lng.toFixed(4)}` : 'Not set'}</strong></div>
                        </div>
                      </div>

                      {/* Category Summary */}
                      <div className="card border rounded-3 p-3 mb-3 bg-light">
                        <div className="d-flex justify-content-between align-items-center mb-2">
                          <strong className="text-secondary small"><i className="bi bi-tag-fill text-success me-1"></i> Category & Description</strong>
                          <button type="button" onClick={() => setCurrentStep(3)} className="btn btn-outline-primary btn-sm rounded-pill px-2.5 py-0.5" style={{ fontSize: '0.62rem' }}>
                            <i className="bi bi-pencil-fill me-1"></i>Edit
                          </button>
                        </div>
                        <div className="row g-1 small text-muted" style={{ fontSize: '0.74rem' }}>
                          <div className="col-6"><span className="d-block text-muted">Category:</span><strong className="text-secondary">{formData.category}</strong></div>
                          <div className="col-6"><span className="d-block text-muted">Subcategory:</span><strong className="text-secondary">{formData.subcategory}</strong></div>
                          <div className="col-12 mt-1"><span className="d-block text-muted">Title:</span><strong className="text-secondary">{formData.title || '—'}</strong></div>
                          <div className="col-12 mt-1"><span className="d-block text-muted">Description:</span><span className="text-secondary" style={{ fontSize: '0.72rem' }}>{formData.description || '—'}</span></div>
                        </div>
                      </div>

                      {/* Media Summary */}
                      <div className="card border rounded-3 p-3 mb-3 bg-light">
                        <div className="d-flex justify-content-between align-items-center mb-2">
                          <strong className="text-secondary small"><i className="bi bi-camera-fill text-success me-1"></i> Media Proof</strong>
                          <button type="button" onClick={() => setCurrentStep(4)} className="btn btn-outline-primary btn-sm rounded-pill px-2.5 py-0.5" style={{ fontSize: '0.62rem' }}>
                            <i className="bi bi-pencil-fill me-1"></i>Edit
                          </button>
                        </div>
                        {formData.photoPreview ? (
                          <img src={formData.photoPreview} alt="Proof" className="img-thumbnail rounded-3" style={{ maxHeight: '80px', objectFit: 'cover' }} />
                        ) : (
                          <span className="text-muted small">No photo uploaded</span>
                        )}
                      </div>

                      {/* SLA Preview */}
                      <div className="card border border-success border-opacity-25 rounded-3 p-3 mb-3" style={{ background: 'rgba(16,185,129,0.04)' }}>
                        <div className="row g-1 small text-muted" style={{ fontSize: '0.74rem' }}>
                          <div className="col-4"><span className="d-block text-muted">Department:</span><strong className="text-success">{currentCategoryMeta.dept}</strong></div>
                          <div className="col-4"><span className="d-block text-muted">Priority:</span><strong className="text-danger">{currentCategoryMeta.priority}</strong></div>
                          <div className="col-4"><span className="d-block text-muted">SLA Target:</span><strong className="text-success">{currentCategoryMeta.SLA}</strong></div>
                        </div>
                      </div>

                      {/* Confirmation Checkbox */}
                      <div className="form-check mb-4">
                        <input 
                          type="checkbox" className="form-check-input" id="confirmBoxFinal" 
                          checked={formData.confirmed} 
                          onChange={(e) => setFormData(prev => ({ ...prev, confirmed: e.target.checked }))}
                        />
                        <label className="form-check-label text-muted small fw-semibold" htmlFor="confirmBoxFinal" style={{ fontSize: '0.75rem' }}>
                          I confirm that all the information provided above is correct and I authorize the submission of this complaint.
                        </label>
                      </div>

                      <div className="d-flex justify-content-between border-top pt-3">
                        <button type="button" onClick={() => setCurrentStep(4)} className="btn btn-outline-secondary px-4 py-2 small">
                          <i className="bi bi-chevron-left me-1"></i> Back
                        </button>
                        <button 
                          type="button" 
                          disabled={!formData.confirmed || loading}
                          onClick={handleSubmit} 
                          className="btn btn-success text-white px-5 py-2 fw-bold shadow-sm"
                        >
                          {loading ? (
                            <><span className="spinner-border spinner-border-sm me-2" role="status"></span>Submitting...</>
                          ) : (
                            <>Confirm & Submit <i className="bi bi-shield-fill-check ms-1"></i></>
                          )}
                        </button>
                      </div>
                    </div>
                  )}

                </form>
              </div>
            </div>

            {/* SLA Preview Column */}
            <div className="col-lg-4">
              {/* 7. Live SLA & Priority Preview Card */}
              <div className="card rc-card border-0 p-4 shadow-sm mb-4 bg-white text-start">
                <span className="badge bg-secondary-soft text-primary rc-badge mb-2">Live SLA Preview</span>
                <h5 className="fw-bold text-secondary mb-3">Priority & SLA Preview</h5>
                
                <div className="d-flex flex-column gap-3">
                  <div className="p-2.5 rounded-3 bg-light border border-light">
                    <span className="text-muted d-block small">Complaint Category</span>
                    <strong className="text-secondary">{formData.category}</strong>
                  </div>
                  <div className="p-2.5 rounded-3 bg-light border border-light">
                    <span className="text-muted d-block small">Expected Resolution Time</span>
                    <strong className="text-success">{currentCategoryMeta.SLA}</strong>
                  </div>
                  <div className="p-2.5 rounded-3 bg-light border border-light">
                    <span className="text-muted d-block small">Assigned Municipal Dept</span>
                    <strong className="text-secondary">{currentCategoryMeta.dept}</strong>
                  </div>
                  <div className="p-2.5 rounded-3 bg-light border border-light">
                    <span className="text-muted d-block small">Priority System Rating</span>
                    <span className={`badge ${currentCategoryMeta.priority.includes('High') ? 'bg-danger' : 'bg-success'} text-white py-1 px-2.5 mt-1 small rounded-pill fw-bold`}>
                      {currentCategoryMeta.priority}
                    </span>
                  </div>
                  <div className="p-2.5 rounded-3 bg-light border border-light">
                    <span className="text-muted d-block small">Escalation Authority Rule</span>
                    <strong className="text-danger small" style={{ fontSize: '0.7rem' }}>
                      Ward Officer <i className="bi bi-arrow-right"></i> Dept Head <i className="bi bi-arrow-right"></i> Commissioner
                    </strong>
                  </div>
                </div>
              </div>


            </div>

          </div>
        )}

        {/* 8. Submit Success State View & Gov printable e-Slip overlay */}
        {isSubmitted && successDetails && (
          <div className="row justify-content-center text-start">
            <div className="col-lg-8 animate-fade-in">
              <div className="card border-0 rounded-4 shadow-lg p-5 bg-white text-center">
                <div className="rounded-circle bg-success text-white mx-auto mb-4 d-flex align-items-center justify-content-center pulse-glow" style={{ width: '70px', height: '70px', fontSize: '2.5rem' }}>
                  <i className="bi bi-check-lg"></i>
                </div>
                
                <h3 className="fw-bold text-secondary mb-2">Complaint Submitted Successfully!</h3>
                <p className="text-muted small mb-4 mx-auto" style={{ maxWidth: '440px' }}>
                  Your civic issue has been registered. The system automatically routed it to the Jodhpur municipal office.
                </p>

                {/* Details Sheet */}
                <div className="bg-light p-4 rounded-3 border text-start mb-4">
                  <div className="row g-3 small">
                    <div className="col-6">
                      <span className="text-muted d-block small">Complaint ID</span>
                      <strong className="text-gradient-primary fs-5">{successDetails.id}</strong>
                    </div>
                    <div className="col-6">
                      <span className="text-muted d-block small">SLA Resolution Target</span>
                      <strong className="text-danger">{successDetails.sla}</strong>
                    </div>
                    <div className="col-6">
                      <span className="text-muted d-block small">Mapped Department</span>
                      <strong className="text-secondary">{successDetails.dept}</strong>
                    </div>
                    <div className="col-6">
                      <span className="text-muted d-block small">ULB Scope</span>
                      <strong className="text-secondary">{successDetails.ulb}</strong>
                    </div>
                  </div>
                </div>

                {/* Redirects */}
                <div className="d-flex flex-wrap justify-content-center gap-3">
                  <button onClick={() => { setTrackID(successDetails.id); setActiveSection('track'); setTrackingResult(null); }} className="btn btn-success text-white py-2.5 px-4 shadow-sm fw-bold">
                    Track Complaint Status
                  </button>
                  <button onClick={() => setShowReceipt(true)} className="btn btn-outline-primary py-2.5 px-4 fw-bold">
                    <i className="bi bi-download me-1"></i> View & Print e-Slip
                  </button>
                  {setActivePage && (
                    <button onClick={() => setActivePage('Dashboards')} className="btn btn-primary text-white py-2.5 px-4 fw-bold">
                      Go to Citizen Dashboard
                    </button>
                  )}
                  <button onClick={() => { setIsSubmitted(false); setCurrentStep(1); }} className="btn btn-outline-success py-2.5 px-4 fw-bold">
                    Submit Another Complaint
                  </button>
                </div>

                {/* Government e-Slip print receipt overlay modal */}
                {showReceipt && (
                  <div className="position-fixed top-0 start-0 w-100 h-100 bg-dark bg-opacity-75 d-flex align-items-center justify-content-center" style={{ zIndex: 1050 }}>
                    <div className="card p-4 rounded-4 shadow-lg text-start border-0 animate-scale-up" style={{ width: '480px', background: '#fff', borderLeft: '8px solid #0f4c81' }}>
                      <div className="d-flex justify-content-between align-items-center border-bottom pb-2 mb-3">
                        <div>
                          <strong className="text-secondary small d-block">GOVERNMENT OF RAJASTHAN</strong>
                          <span className="text-muted text-xxs" style={{ fontSize: '0.62rem' }}>Department of Local Self Government</span>
                        </div>
                        <button onClick={() => setShowReceipt(false)} className="btn btn-close btn-sm"></button>
                      </div>

                      {/* Watermarked printable body */}
                      <div className="position-relative border p-3 rounded bg-light" style={{ minHeight: '260px' }}>
                        {/* Emblem watermark background */}
                        <div className="position-absolute text-muted opacity-5 font-weight-black" style={{ fontSize: '3rem', top: '35%', left: '20%', transform: 'rotate(-25deg)', zIndex: 0, fontWeight: 900, userSelect: 'none', pointerEvents: 'none' }}>
                          RAJASTHAN GOV
                        </div>

                        <div className="position-relative z-1">
                          <h6 className="fw-bold text-secondary mb-2 text-center">OFFICIAL CIVIC COMPLAINT e-SLIP</h6>
                          
                          <div className="d-flex justify-content-between align-items-center mb-3">
                            <span className="text-xxs text-muted" style={{ fontSize: '0.65rem' }}>Receipt No: eSLIP-{successDetails.id.split('-')[4]}</span>
                            <span className="text-xxs text-muted" style={{ fontSize: '0.65rem' }}>Date: 26-May-2026</span>
                          </div>

                          <div className="row g-2.5 small" style={{ fontSize: '0.72rem' }}>
                            <div className="col-6"><strong>Complaint ID:</strong><br />{successDetails.id}</div>
                            <div className="col-6"><strong>SLA Target:</strong><br />{successDetails.sla}</div>
                            <div className="col-6"><strong>Category:</strong><br />{successDetails.category}</div>
                            <div className="col-6"><strong>ULB Boundary:</strong><br />{successDetails.ulb}</div>
                            <div className="col-12"><strong>Assigned Ward:</strong><br />{successDetails.ward} (Sanitation & Drainage Team)</div>
                          </div>

                          {/* Digital sign and QR Code */}
                          <div className="d-flex align-items-end justify-content-between border-top pt-3 mt-3">
                            <div>
                              <i className="bi bi-patch-check-fill text-success me-1"></i>
                              <span className="text-xxs text-success fw-bold" style={{ fontSize: '0.65rem' }}>DIGITALLY SIGNED</span>
                              <span className="text-muted d-block text-xxs" style={{ fontSize: '0.55rem' }}>RajCivic Verification Desk</span>
                            </div>
                            
                            {/* Scannable mock QR code */}
                            <div className="border p-1 bg-white" style={{ width: '48px', height: '48px' }}>
                              <i className="bi bi-qr-code text-dark fs-3"></i>
                            </div>
                          </div>
                        </div>
                      </div>

                      <button onClick={() => window.print()} className="btn btn-primary w-100 py-2.5 small mt-3 fw-bold">
                        <i className="bi bi-printer-fill me-1"></i> Print Receipt
                      </button>
                    </div>
                  </div>
                )}

              </div>
            </div>
          </div>
        )}

        {/* 9. Track Complaint Section & 10. Timeline Preview */}
        {activeSection === 'track' && showOnlyTrack && (
          <div className="row justify-content-center text-start animate-slide-up">
            <div className="col-lg-10">
              <div className="card border-0 rounded-4 shadow-sm p-4 bg-white mb-4">
                <h5 className="fw-bold text-secondary mb-4 border-bottom pb-2">
                  <i className="bi bi-compass-fill text-success me-2"></i>
                  Track Existing Complaint Status
                </h5>

                <form onSubmit={handleTrackSearch} className="row g-3 align-items-end mb-4">
                  <div className="col-md-7">
                    <label className="form-label small fw-bold text-secondary">Complaint ID *</label>
                    <input 
                      type="text" required value={trackID} 
                      onChange={(e) => setTrackID(e.target.value)}
                      className="form-control rc-form-control p-3 bg-light border-0 rounded-3 text-secondary" placeholder="E.g. RJCIVIC-JOD-NNJ-2026-0001" 
                    />
                  </div>
                  <div className="col-md-5">
                    <button type="submit" className="btn rc-btn-primary w-100 py-2.5">
                      Track Complaint Status
                    </button>
                  </div>
                </form>

                {/* Tracking Result & SLA Countdown */}
                {trackingResult && (
                  <div className="animate-fade-in border-top pt-4">
                    
                    {/* Header Details Panel */}
                    <div className="d-flex flex-wrap justify-content-between align-items-center mb-4 gap-2 border-bottom pb-3">
                      <div className="d-flex flex-wrap align-items-center gap-3">
                        <div>
                          <span className="text-muted small">Tracking Grievance File: </span>
                          <strong className="text-gradient-primary fs-5 d-block d-sm-inline ms-sm-1">{trackingResult.id}</strong>
                        </div>
                        <button 
                          onClick={() => {
                            setSuccessDetails({
                              id: trackingResult.id,
                              category: trackingResult.subcategory,
                              sla: trackingResult.slaTotal,
                              dept: trackingResult.dept,
                              ulb: trackingResult.ulb,
                              ward: trackingResult.ward
                            });
                            setShowReceipt(true);
                          }}
                          className="btn btn-sm btn-outline-success rounded-pill px-3 py-1 fw-bold d-flex align-items-center gap-1 text-xxs"
                          style={{ fontSize: '0.72rem' }}
                        >
                          <i className="bi bi-file-earmark-arrow-down-fill text-success"></i> Download e-Slip Receipt
                        </button>
                      </div>
                      
                      {/* Active Ticking SLA countdown box */}
                      <span className="badge bg-danger-soft text-danger border border-danger border-opacity-10 py-2 px-3 rounded-pill fw-bold small">
                        <i className="bi bi-clock-history me-1 animate-pulse"></i>
                        SLA ESCALATION IN: {formatCountdown(countdownSeconds)}
                      </span>
                    </div>

                    <div className="row g-3.5 text-start mb-4">
                      {/* A. Basic Details Card */}
                      <div className="col-md-6">
                        <div className="card border-0 p-3 bg-light rounded-3 h-100 shadow-xxs">
                          <strong className="text-secondary small d-block mb-2 text-uppercase font-semibold" style={{ letterSpacing: '0.05em', fontSize: '0.68rem' }}>
                            <i className="bi bi-info-circle text-primary"></i> A. Grievance Basic Details
                          </strong>
                          <div className="d-flex flex-column gap-2 small">
                            <div><span className="text-muted">Title:</span> <strong className="text-secondary">{trackingResult.title}</strong></div>
                            <div><span className="text-muted">Category:</span> <span className="badge bg-primary-soft text-primary rounded-pill px-2 py-0.5">{trackingResult.category} - {trackingResult.subcategory}</span></div>
                            <div><span className="text-muted">Description:</span> <p className="text-muted text-xxs mb-0 mt-0.5" style={{ lineHeight: '1.4' }}>{trackingResult.description}</p></div>
                            <div><span className="text-muted">Submitted Timestamp:</span> <strong className="text-secondary">{trackingResult.date} at {trackingResult.time}</strong></div>
                            <div><span className="text-muted">Colony Area:</span> <strong className="text-secondary">{trackingResult.ward}</strong></div>
                          </div>
                        </div>
                      </div>

                      {/* B. Current Status & SLA Clocks Card */}
                      <div className="col-md-6">
                        <div className="card border-0 p-3 bg-white border border-light rounded-3 h-100 shadow-xxs">
                          <strong className="text-secondary small d-block mb-2 text-uppercase font-semibold" style={{ letterSpacing: '0.05em', fontSize: '0.68rem' }}>
                            <i className="bi bi-check-all text-success"></i> B & F. Current Status & SLA Clocks
                          </strong>
                          
                          <div className="p-3 bg-success bg-opacity-5 border border-success border-opacity-10 rounded-3 mb-3 text-center">
                            <span className="text-muted text-xxs d-block mb-0.5">CURRENT STAGE ASSIGNED</span>
                            <span className="badge bg-success text-white px-3 py-1.5 fw-bold rounded-pill text-uppercase fs-6">
                              {trackingResult.status}
                            </span>
                          </div>

                          <div className="d-flex flex-column gap-2 small">
                            <div className="d-flex justify-content-between">
                              <span className="text-muted">Expected SLA Window:</span>
                              <strong className="text-secondary">{trackingResult.slaTotal}</strong>
                            </div>
                            <div className="d-flex justify-content-between">
                              <span className="text-muted">Remaining Time:</span>
                              <strong className="text-danger animate-pulse">{trackingResult.slaRemaining}</strong>
                            </div>
                            <div className="d-flex justify-content-between border-top pt-2">
                              <span className="text-muted">SLA Status:</span>
                              <span className="badge bg-success-soft text-success rounded-pill fw-bold">Active Compliance</span>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* C. Operational Timeline Panel */}
                    <div className="card border-0 p-3 bg-light rounded-3 mb-4 text-start">
                      <strong className="text-secondary small d-block mb-3.5 text-uppercase font-semibold" style={{ letterSpacing: '0.05em', fontSize: '0.68rem' }}>
                        <i className="bi bi-clock-history text-primary"></i> C. Complaint Operational Lifecycle (11 Stages)
                      </strong>
                      
                      <div className="row g-2 text-center">
                        {stages.map((st, idx) => {
                          const isActive = idx <= trackingResult.activeIdx;
                          const isCurrent = idx === trackingResult.activeIdx;
                          
                          // Stage colors: Green completed, Blue current, Gray pending
                          const circleStyle = isCurrent 
                            ? 'bg-primary text-white pulse-glow border-primary' 
                            : isActive 
                            ? 'bg-success text-white border-success' 
                            : 'bg-white text-muted border';

                          const textClass = isCurrent 
                            ? 'text-primary fw-bold' 
                            : isActive 
                            ? 'text-success fw-semibold' 
                            : 'text-muted';

                          return (
                            <div className="col-6 col-md" key={idx}>
                              <div className="d-flex flex-column align-items-center">
                                <div 
                                  className={`rounded-circle d-flex align-items-center justify-content-center shadow-sm fw-bold ${circleStyle}`}
                                  style={{ width: '28px', height: '28px', fontSize: '0.72rem', zIndex: 2 }}
                                >
                                  {isActive && !isCurrent ? <i className="bi bi-check-lg" style={{ fontSize: '0.7rem' }}></i> : idx + 1}
                                </div>
                                <span className={`mt-1.5 d-block text-xxs ${textClass}`} style={{ fontSize: '0.6rem', lineHeight: '1.2' }}>{st.title}</span>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>

                    {/* D. Department & E. Worker Assignment Panel */}
                    <div className="row g-3.5 text-start mb-4">
                      
                      {/* D & E details */}
                      <div className="col-md-6">
                        <div className="card border-0 p-3 bg-white border border-light rounded-3 h-100 shadow-xxs">
                          <strong className="text-secondary small d-block mb-3 text-uppercase font-semibold" style={{ letterSpacing: '0.05em', fontSize: '0.68rem' }}>
                            <i className="bi bi-shield-shaded text-primary"></i> D & E. Assigned Administration & Crew
                          </strong>
                          
                          <div className="d-flex flex-column gap-3 small">
                            <div className="d-flex align-items-start gap-2 border-bottom pb-2">
                              <div className="bg-primary-soft text-primary rounded-circle p-1.5 d-flex align-items-center justify-content-center" style={{ width: '28px', height: '28px' }}>
                                <i className="bi bi-building"></i>
                              </div>
                              <div>
                                <span className="text-muted text-xxs d-block" style={{ fontSize: '0.6rem' }}>Jurisdiction ULB</span>
                                <strong className="text-secondary">{trackingResult.ulb}</strong>
                              </div>
                            </div>

                            <div className="d-flex align-items-start gap-2 border-bottom pb-2">
                              <div className="bg-success-soft text-success rounded-circle p-1.5 d-flex align-items-center justify-content-center" style={{ width: '28px', height: '28px' }}>
                                <i className="bi bi-person-fill-check"></i>
                              </div>
                              <div>
                                <span className="text-muted text-xxs d-block" style={{ fontSize: '0.6rem' }}>Supervising Officer</span>
                                <strong className="text-secondary">{trackingResult.officer}</strong>
                              </div>
                            </div>

                            <div className="d-flex align-items-start gap-2">
                              <div className="bg-info-soft text-info rounded-circle p-1.5 d-flex align-items-center justify-content-center" style={{ width: '28px', height: '28px' }}>
                                <i className="bi bi-truck"></i>
                              </div>
                              <div>
                                <span className="text-muted text-xxs d-block" style={{ fontSize: '0.6rem' }}>Assigned Field Crew Leader</span>
                                <strong className="text-secondary">{trackingResult.worker}</strong>
                                <span className="text-muted d-block text-xxs" style={{ fontSize: '0.65rem' }}>Status: **{trackingResult.workerStatus}** (Contact number masked for privacy).</span>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* G. Location Map Canvas */}
                      <div className="col-md-6">
                        <div className="card border-0 p-3 bg-dark rounded-3 h-100 text-white shadow-xxs position-relative overflow-hidden" style={{ minHeight: '210px', background: 'linear-gradient(135deg, #0f172a 0%, #1e293b 100%)' }}>
                          <div className="position-absolute w-100 h-100 top-0 start-0 opacity-10" style={{ backgroundImage: 'radial-gradient(circle, #ffffff 1px, transparent 1px)', backgroundSize: '12px 12px' }}></div>
                          
                          {/* Map overlays */}
                          <div className="position-absolute bg-success rounded-circle animate-pulse" style={{ width: '18px', height: '18px', top: '48%', left: '46%', filter: 'blur(1px)', opacity: 0.8 }}>
                            <i className="bi bi-geo-alt-fill text-white small position-absolute top-50 start-50 translate-middle" style={{ fontSize: '0.55rem' }}></i>
                          </div>
                          
                          <span className="badge bg-dark bg-opacity-75 text-success border border-success border-opacity-30 position-absolute top-2 left-2 px-2 py-0.5" style={{ fontSize: '0.58rem', letterSpacing: '0.05em' }}>
                            <i className="bi bi-map-fill me-1"></i> G. OpenStreetMap Leaflet GIS Preview
                          </span>

                          <div className="d-flex flex-column align-items-center justify-content-center h-100" style={{ zIndex: 3, position: 'relative' }}>
                            <i className="bi bi-compass text-success display-6 opacity-35 mb-1.5"></i>
                            <h6 className="fw-bold m-0" style={{ fontSize: '0.78rem' }}>Plot 42, Shastri Nagar, Ward 12</h6>
                            <span className="text-muted" style={{ fontSize: '0.62rem' }}>GIS Layer Matched with Centroid coordinates</span>
                          </div>
                        </div>
                      </div>

                    </div>

                    {/* H. Proof Section & I. Officer Remarks */}
                    <div className="row g-3.5 text-start mb-4">
                      
                      {/* H. Proof Gallery */}
                      <div className="col-md-7">
                        <div className="card border-0 p-3 bg-light rounded-3 h-100 shadow-xxs">
                          <strong className="text-secondary small d-block mb-3.5 text-uppercase font-semibold" style={{ letterSpacing: '0.05em', fontSize: '0.68rem' }}>
                            <i className="bi bi-images text-primary"></i> H. Physical Ground Proof Verification
                          </strong>
                          
                          <div className="row g-2.5">
                            <div className="col-6">
                              <div className="bg-dark rounded p-2 text-center text-white position-relative overflow-hidden" style={{ minHeight: '110px', background: 'linear-gradient(180deg, #374151 0%, #111827 100%)' }}>
                                <span className="text-white d-block fw-bold mb-1.5 position-relative z-1" style={{ fontSize: '0.58rem', textShadow: '0 1px 2px rgba(0,0,0,0.8)' }}>BEFORE REPAIR</span>
                                {trackingResult.beforeProof ? (
                                  <img src={trackingResult.beforeProof} alt="Before Repair Proof" className="position-absolute top-0 start-0 w-100 h-100 object-fit-cover opacity-75" />
                                ) : (
                                  <>
                                    <i className="bi bi-camera-fill text-danger fs-3 opacity-30 mb-1 d-block position-relative z-1"></i>
                                    <span className="text-muted d-block text-xxs position-relative z-1" style={{ fontSize: '0.55rem' }}>Geotagged Photo Lock</span>
                                  </>
                                )}
                              </div>
                            </div>
                            <div className="col-6">
                              <div className="bg-dark rounded p-2 text-center text-white position-relative overflow-hidden" style={{ minHeight: '110px', background: 'linear-gradient(180deg, #1f2937 0%, #030712 100%)' }}>
                                <span className="text-white d-block fw-bold mb-1.5 position-relative z-1" style={{ fontSize: '0.58rem', textShadow: '0 1px 2px rgba(0,0,0,0.8)' }}>AFTER REPAIR</span>
                                {trackingResult.afterProof ? (
                                  <img src={trackingResult.afterProof} alt="After Repair Proof" className="position-absolute top-0 start-0 w-100 h-100 object-fit-cover opacity-75" />
                                ) : (
                                  <>
                                    <i className="bi bi-patch-check-fill text-success fs-3 opacity-35 mb-1 d-block position-relative z-1"></i>
                                    <span className="text-muted d-block text-xxs position-relative z-1" style={{ fontSize: '0.55rem' }}>Worker Completion Upload</span>
                                  </>
                                )}
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* I. Officer Remarks */}
                      <div className="col-md-5">
                        <div className="card border-0 p-3 bg-white border border-light rounded-3 h-100 shadow-xxs">
                          <strong className="text-secondary small d-block mb-2 text-uppercase font-semibold" style={{ letterSpacing: '0.05em', fontSize: '0.68rem' }}>
                            <i className="bi bi-chat-left-dots text-primary"></i> I. Officer Remarks & Logs
                          </strong>
                          <div className="bg-light p-2.5 rounded-3 border border-light" style={{ minHeight: '110px' }}>
                            <span className="text-muted d-block text-xxs" style={{ fontSize: '0.6rem' }}>PUBLIC REMARKS</span>
                            <p className="text-secondary small fw-semibold mt-1 mb-0" style={{ lineHeight: '1.4', fontSize: '0.72rem' }}>
                              "{trackingResult.officerRemarks}"
                            </p>
                          </div>
                        </div>
                      </div>

                    </div>

                    {/* J. Citizen Feedback / Reopen Complaint Option */}
                    <div className="card border-0 p-4 shadow-sm bg-white rounded-4 border border-success border-opacity-10 text-start" style={{ background: 'linear-gradient(180deg, rgba(240, 253, 244, 0.4) 0%, rgba(255, 255, 255, 1) 100%)' }}>
                      <div className="d-flex align-items-center gap-2 mb-3">
                        <div className="bg-success text-white rounded-circle p-1.5 d-flex align-items-center justify-content-center" style={{ width: '32px', height: '32px' }}>
                          <i className="bi bi-star-fill text-warning"></i>
                        </div>
                        <h6 className="fw-bold text-secondary m-0">J. Citizen Feedback & Case Closure Desk</h6>
                      </div>

                      {feedbackSubmitted ? (
                        <div className="alert alert-success border-0 p-3 rounded-3 mb-0 animate-scale-up text-center">
                          <i className="bi bi-patch-check-fill text-success fs-4 d-block mb-1"></i>
                          <strong className="text-secondary small d-block">Feedback Locked Successfully!</strong>
                          <span className="text-muted d-block text-xxs" style={{ fontSize: '0.65rem' }}>Thank you! Your feedback closes this grievance ticket permanently in the Rajasthan Municipal database.</span>
                        </div>
                      ) : (
                        <div>
                          <p className="text-muted small mb-3">
                            Municipal records show the field crew has successfully completed work on this issue. Are you fully satisfied with the resolution?
                          </p>

                          {/* Star Selector */}
                          <div className="d-flex align-items-center gap-2 mb-3">
                            <span className="text-muted small">Your Rating:</span>
                            <div className="d-flex gap-1">
                              {[1, 2, 3, 4, 5].map((star) => (
                                <i 
                                  key={star}
                                  onClick={() => setFeedbackRating(star)}
                                  className={`bi bi-star-fill fs-5 cursor-pointer transition-all ${star <= feedbackRating ? 'text-warning' : 'text-muted'}`}
                                  style={{ cursor: 'pointer' }}
                                ></i>
                              ))}
                            </div>
                            <span className="badge bg-warning-soft text-dark small fw-bold ms-2">{feedbackRating} Stars</span>
                          </div>

                          <div className="mb-3">
                            <label className="form-label text-secondary small fw-bold">Satisfaction Comments / Feedback (Optional)</label>
                            <input 
                              type="text" 
                              placeholder="e.g. Excellent work done! Highly satisfied."
                              className="form-control form-control-sm border py-2 px-3 rounded-3"
                              style={{ fontSize: '0.8rem' }}
                              value={feedbackComment}
                              onChange={(e) => setFeedbackComment(e.target.value)}
                            />
                          </div>

                          <div className="d-flex flex-wrap gap-2">
                            <button 
                              onClick={handleFeedbackSubmit}
                              className="btn btn-success text-white btn-sm px-4 rounded-pill fw-bold border-0 bg-success hover-success-dark"
                            >
                              <i className="bi bi-shield-fill-check me-1"></i> Yes, Close Complaint
                            </button>
                            <button 
                              onClick={() => {
                                setReopenData((prev) => ({ ...prev, id: trackingResult.id }));
                                setActiveSection('reopen');
                              }}
                              className="btn btn-danger text-white btn-sm px-4 rounded-pill fw-bold border-0 bg-danger hover-danger-dark"
                            >
                              <i className="bi bi-arrow-counterclockwise me-1"></i> No, Reopen Complaint
                            </button>
                          </div>
                        </div>
                      )}
                    </div>

                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* 11. Reopen Complaint Section */}
        {activeSection === 'reopen' && (
          <div className="row justify-content-center text-start animate-slide-up">
            <div className="col-lg-8">
              <div className="card border-0 rounded-4 shadow-sm p-4 bg-white">
                <h5 className="fw-bold text-secondary mb-4 border-bottom pb-2">
                  <i className="bi bi-arrow-counterclockwise text-success me-2"></i>
                  Reopen Resolved Complaint
                </h5>

                {!reopenSuccess ? (
                  <form onSubmit={handleReopenSubmit}>
                    <div className="row g-3 mb-4">
                      <div className="col-sm-12">
                        <label className="form-label small fw-bold text-secondary">Complaint ID *</label>
                        <input 
                          type="text" required value={reopenData.id} 
                          onChange={(e) => setReopenData(prev => ({ ...prev, id: e.target.value }))}
                          className="form-control rc-form-control p-3 bg-light border-0 rounded-3 text-secondary" placeholder="E.g. RJCIVIC-JOD-NNJ-2026-0001" 
                        />
                      </div>
                      <div className="col-sm-12">
                        <label className="form-label small fw-bold text-secondary">Reopen Reason *</label>
                        <select 
                          className="form-select rc-form-control p-3 bg-light border-0 rounded-3 text-secondary" value={reopenData.reason}
                          onChange={(e) => setReopenData(prev => ({ ...prev, reason: e.target.value }))}
                        >
                          <option value="Issue not solved">Issue not solved</option>
                          <option value="Wrong location work">Wrong location work</option>
                          <option value="Fake completion proof">Fake completion proof</option>
                          <option value="Temporary solution">Temporary solution</option>
                          <option value="Worker did not visit">Worker did not visit</option>
                          <option value="Problem repeated again">Problem repeated again</option>
                        </select>
                      </div>
                      <div className="col-sm-12">
                        <label className="form-label small fw-bold text-secondary">Describe Why Resolution is Poor *</label>
                        <textarea 
                          rows="3" required value={reopenData.desc} 
                          onChange={(e) => setReopenData(prev => ({ ...prev, desc: e.target.value }))}
                          className="form-control rc-form-control p-3 bg-light border-0 rounded-3 text-secondary" placeholder="Provide full details of incomplete repair works"
                        ></textarea>
                      </div>
                      <div className="col-sm-12 text-start">
                        <label className="form-label small fw-bold text-secondary">Upload Proof Image (Recommended) *</label>
                        <input 
                          type="file" 
                          required 
                          className="form-control form-control-sm" 
                          accept="image/*" 
                          onChange={(e) => setReopenData(prev => ({ ...prev, photo: e.target.files[0] }))}
                        />
                        <span className="text-muted d-block mt-1" style={{ fontSize: '0.65rem' }}>Attach a fresh photograph showing the issue is still active.</span>
                      </div>
                    </div>

                    <button type="submit" className="btn rc-btn-primary w-100 py-2.5">
                      Submit Reopen Request
                    </button>
                  </form>
                ) : (
                  <div className="text-center p-4 animate-fade-in">
                    <div className="rounded-circle bg-warning text-dark mx-auto mb-4 d-flex align-items-center justify-content-center pulse-glow" style={{ width: '60px', height: '60px', fontSize: '2rem' }}>
                      <i className="bi bi-clock-history"></i>
                    </div>
                    <h4 className="fw-bold text-secondary mb-2">Reopen Case Requested Successfully!</h4>
                    <p className="text-muted small mb-4">
                      The Nodal Officer will verify your submitted completion photo mismatch. The SLA stopwatch timer is restarted.
                    </p>
                    <button onClick={() => { setReopenSuccess(false); setReopenData({ id: '', reason: 'Issue not solved', desc: '', photo: null }); }} className="btn btn-outline-success px-4 py-2">
                      Submit Another Request
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

      </div>
    </section>
  );
}
