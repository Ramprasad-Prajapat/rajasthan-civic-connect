import React, { useState, useEffect } from 'react';
import { createComplaint, getComplaint, getComplaintPhoto, submitFeedback, reopenComplaint, saveComplaintDraft, getComplaintDraft, deleteComplaintDraft } from '../apiService';
import { onlyDigits, normalizeMobile, isValidMobile, getMobileError, handleMobileKeyDown } from '../validators';
import MapPicker from './MapPicker';
export default function ComplaintCenter({ setActivePage, showOnlyTrack = false, authenticatedUser = null }) {
  // Page sections: 'submit' (form), 'track' (tracking), 'reopen' (reopen form)
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


  const [mobileTouched, setMobileTouched] = useState(false);
  const mobileError = getMobileError(formData.mobile, true, mobileTouched);

  // FAQ Expanded index state
  const [faqIndex, setFaqIndex] = useState(0);

  // Tracking States
  const [trackID, setTrackID] = useState('');
  const [trackingResult, setTrackingResult] = useState(null);
  const [trackLoading, setTrackLoading] = useState(false);
  const [trackError, setTrackError] = useState('');
  const [trackColdStart, setTrackColdStart] = useState(false);
  const [lazyPhoto, setLazyPhoto] = useState(null);
  const [lazyPhotoLoading, setLazyPhotoLoading] = useState(false);
  const [slaInfo, setSlaInfo] = useState({
    statusText: '',
    badgeClass: 'bg-primary-soft text-primary',
    label: 'On track',
    remainingText: '',
    isComplete: false,
    isOverdue: false
  });
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

  // Location Selection States (Manual Entry Primary + Keyless OpenStreetMap Picker)
  const [locationMethod, setLocationMethod] = useState('manual'); // 'manual' (main path), 'map' (interactive picker)
  const [showMapPicker, setShowMapPicker] = useState(false);
  const [mapCenter, setMapCenter] = useState([26.9124, 75.7873]); // Default: Jaipur, Rajasthan
  const [markerPosition, setMarkerPosition] = useState(null);
  const [coordinates, setCoordinates] = useState({ lat: null, lng: null });
  const [locationSource, setLocationSource] = useState('MANUAL_ENTRY');

  const handleMapLocationSelect = (lat, lng) => {
    setCoordinates({ lat, lng });
    setMarkerPosition([lat, lng]);
    setLocationSource('MAP_SELECTION');
  };

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
        mobile: onlyDigits(authenticatedUser.phone || authenticatedUser.mobile || prev.mobile)
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
        setFormData(prev => ({
          ...prev,
          ...draftData.formData,
          mobile: onlyDigits(draftData.formData?.mobile || prev.mobile)
        }));
        if (draftData.coordinates) {
          setCoordinates(draftData.coordinates);
          setMarkerPosition([draftData.coordinates.lat, draftData.coordinates.lng]);
        }
        if (draftData.locationMethod) setLocationMethod(draftData.locationMethod);
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
        locationMethod,
        locationSource,
        currentStep,
        updatedAt: new Date().toISOString()
      };
      
      if (authenticatedUser) {
        localStorage.removeItem('rajcivic_complaint_draft');
        saveComplaintDraft(draftData).catch(err => console.error("Failed to sync draft to backend:", err));
      } else {
        localStorage.setItem('rajcivic_complaint_draft', JSON.stringify(draftData));
      }
    }, 1000);
    
    return () => clearTimeout(timer);
  }, [formData, coordinates, locationMethod, locationSource, currentStep, authenticatedUser, showOnlyTrack, isSubmitted]);

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

  // Category mapping metadata and department auto-routing
  const categoriesMap = {
    'Garbage Collection': {
      dept: 'Sanitation Department',
      icon: 'bi-trash3-fill', color: 'text-success bg-primary-soft',
      subs: ['Daily waste pickup', 'Garbage dump clearance', 'Community bin overflow']
    },
    'Water Leakage': {
      dept: 'Water Supply Department',
      icon: 'bi-droplet-fill', color: 'text-danger bg-danger-soft',
      subs: ['Main line leak', 'Service line damage', 'Valve leakage']
    },
    'Water Supply': {
      dept: 'Water Supply Department',
      icon: 'bi-droplet-half', color: 'text-primary bg-secondary-soft',
      subs: ['No water supply', 'Low pressure', 'Contaminated water supply']
    },
    'Sewer Overflow': {
      dept: 'Sewerage Department',
      icon: 'bi-funnel-fill', color: 'text-danger bg-danger-soft',
      subs: ['Road overflow', 'Backflow in house', 'Manhole damage']
    },
    'Drainage Blockage': {
      dept: 'Sewerage Department',
      icon: 'bi-exclamation-octagon-fill', color: 'text-danger bg-danger-soft',
      subs: ['Stormwater drain block', 'Main drain choking', 'Open cover block']
    },
    'Street Light Issue': {
      dept: 'Electrical Department',
      icon: 'bi-lightbulb-fill', color: 'text-success bg-primary-soft',
      subs: ['Bulb/LED fused', 'Complete street dark', 'Timer issue']
    },
    'Open Electrical Wire': {
      dept: 'Electrical Department',
      icon: 'bi-lightning-charge-fill', color: 'text-danger bg-danger-soft',
      subs: ['Hanging wires', 'Pole spark', 'Transformer wire open']
    },
    'Road Damage': {
      dept: 'Public Works Department',
      icon: 'bi-cone-striped', color: 'text-secondary bg-light',
      subs: ['Major cracks', 'Divider broken', 'Footpath damaged']
    },
    'Potholes': {
      dept: 'Public Works Department',
      icon: 'bi-signpost-split-fill', color: 'text-warning bg-accent-soft',
      subs: ['Multiple deep potholes', 'Pothole patch sink']
    },
    'Public Toilet Maintenance': {
      dept: 'Sanitation Department',
      icon: 'bi-badge-wc-fill', color: 'text-success bg-primary-soft',
      subs: ['Dirty cabins', 'No water supply', 'Light not working']
    },
    'Park Maintenance': {
      dept: 'Public Works Department',
      icon: 'bi-flower1', color: 'text-secondary bg-light',
      subs: ['Broken bench', 'Uncut wild grass', 'Play swings damaged']
    },
    'Encroachment': {
      dept: 'Encroachment Department',
      icon: 'bi-x-octagon-fill', color: 'text-warning bg-accent-soft',
      subs: ['Footpath shop blockade', 'Illegal parking block', 'Temporary tin shed']
    },
    'Animal Issue': {
      dept: 'Animal Control Department',
      icon: 'bi-bug-fill', color: 'text-warning bg-accent-soft',
      subs: ['Stray dog menace', 'Monkey gang threat', 'Stray cattle on road']
    },
    'Tree Damage': {
      dept: 'Forest & Environment Department',
      icon: 'bi-tree-fill', color: 'text-success bg-primary-soft',
      subs: ['Fallen tree branch', 'Dried unsafe tree', 'Pruning request']
    },
    'Other': {
      dept: 'General Administration',
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
    { key: 'Submitted', title: 'Submitted', desc: 'Complaint registered' },
    { key: 'InProgress', title: 'In Progress', desc: 'Team in progress' },
    { key: 'Resolved', title: 'Resolved', desc: 'Action completed by officer' },
    { key: 'Closed', title: 'Closed', desc: 'Case permanently closed' }
  ];

  // ============================================================
  // MUNICIPAL LOCATION SELECTION — Verified Rajasthan ULB Cascades
  // ============================================================

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
      accuracy: null,
      address: formData.fullAddress || '',
      areaColony: formData.area || '',
      locationSource: locationSource,
      priority: formData.priority || 'Normal'
    };

    try {
      const result = await createComplaint(complaintData, formData.photo);
      const complaintId = result.complaintId || result.id || 'RJCIVIC-UNKNOWN';
      const apiSlaHours = result.slaHours || (result.createdAt && result.slaDeadline
        ? Math.max(1, Math.round((new Date(result.slaDeadline).getTime() - new Date(result.createdAt).getTime()) / 3600000))
        : null);
      
      setSuccessDetails({
        id: complaintId,
        category: result.category || formData.category,
        subcategory: result.subCategory || formData.subcategory,
        sambhag: formData.sambhag,
        district: result.district || formData.district,
        ulb: result.ulbName || formData.ulbName,
        ward: result.wardNumber || formData.ward,
        dept: result.departmentName || currentCategoryMeta.dept,
        departmentName: result.departmentName || currentCategoryMeta.dept,
        priority: result.priority || 'Normal',
        createdAt: result.createdAt,
        slaHours: apiSlaHours,
        slaDeadline: result.slaDeadline,
        sla: apiSlaHours ? `${apiSlaHours} Hours` : '—',
        assignedOfficerId: result.assignedOfficerId || null,
        assignedOfficerName: result.assignedOfficerName || null
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

  // SLA Countdown & Compliance state calculation
  useEffect(() => {
    if (!trackingResult || !trackingResult.slaDeadline) return;

    const updateSla = () => {
      const isComplete = trackingResult.status === 'Resolved' || trackingResult.status === 'Closed';
      const deadline = new Date(trackingResult.slaDeadline).getTime();

      if (isComplete) {
        const resolvedTime = trackingResult.resolvedAt ? new Date(trackingResult.resolvedAt).getTime() : Date.now();
        const onTime = resolvedTime <= deadline;
        setSlaInfo({
          statusText: onTime ? 'Resolved on time' : 'Resolved late',
          badgeClass: onTime ? 'bg-success-soft text-success' : 'bg-warning-soft text-warning',
          label: onTime ? 'Completed on time' : 'Completed late',
          remainingText: onTime ? 'Resolved on time' : 'Resolved late',
          isComplete: true,
          isOverdue: !onTime
        });
        return;
      }

      const diff = deadline - Date.now();
      if (diff <= 0) {
        const overdue = Math.abs(diff);
        const h = Math.floor(overdue / 3600000);
        const m = Math.floor((overdue % 3600000) / 60000);
        const s = Math.floor((overdue % 60000) / 1000);
        setSlaInfo({
          statusText: `Overdue by ${h}h ${m}m ${s}s`,
          badgeClass: 'bg-danger-soft text-danger',
          label: 'Overdue',
          remainingText: `Overdue by ${h}h ${m}m`,
          isComplete: false,
          isOverdue: true
        });
      } else {
        const h = Math.floor(diff / 3600000);
        const m = Math.floor((diff % 3600000) / 60000);
        const s = Math.floor((diff % 60000) / 1000);
        setSlaInfo({
          statusText: `SLA DUE IN: ${h.toString().padStart(2, '0')}h ${m.toString().padStart(2, '0')}m ${s.toString().padStart(2, '0')}s`,
          badgeClass: 'bg-primary-soft text-primary',
          label: 'On track',
          remainingText: `${h}h ${m}m remaining`,
          isComplete: false,
          isOverdue: false
        });
      }
    };

    updateSla();
    const interval = setInterval(updateSla, 1000);
    return () => clearInterval(interval);
  }, [trackingResult]);

  // Real-time reflection: auto-poll every 15s while visible
  useEffect(() => {
    if (!trackingResult || !trackingResult.id) return;

    const pollInterval = setInterval(() => {
      if (document.visibilityState === 'visible') {
        getComplaint(trackingResult.id)
          .then(updated => {
            if (updated) {
              setTrackingResult(prev => ({
                ...prev,
                status: updated.status,
                remarks: updated.remarks || prev.remarks,
                departmentName: updated.departmentName || prev.departmentName,
                dept: updated.departmentName || prev.dept,
                timeline: updated.timeline || prev.timeline,
                resolvedAt: updated.resolvedAt || prev.resolvedAt,
                closedAt: updated.closedAt || prev.closedAt
              }));
            }
          })
          .catch(() => {});
      }
    }, 15000);

    return () => clearInterval(pollInterval);
  }, [trackingResult?.id]);

  // Auto-search pending complaint ID from session storage
  useEffect(() => {
    const pendingId = sessionStorage.getItem('rajcivic_pending_track_id');
    if (pendingId) {
      sessionStorage.removeItem('rajcivic_pending_track_id');
      setTrackID(pendingId);
      setActiveSection('track');
      handleTrackSearch(null, pendingId);
    }
  }, [showOnlyTrack]);

  // Handle Tracking Search
  const handleTrackSearch = async (e, directId = null) => {
    if (e && e.preventDefault) e.preventDefault();
    const query = (directId || trackID || '').trim();
    if (!query) return;

    setFeedbackSubmitted(false);
    setTrackLoading(true);
    setTrackError('');
    setTrackColdStart(false);

    const coldStartTimer = setTimeout(() => {
      setTrackColdStart(true);
    }, 3000);

    try {
      const fetchPromise = getComplaint(query);
      const timeoutPromise = new Promise((_, reject) =>
        setTimeout(() => reject(new Error('Request timed out after 20 seconds. Please check connection and retry.')), 20000)
      );

      const result = await Promise.race([fetchPromise, timeoutPromise]);
      clearTimeout(coldStartTimer);
      setTrackColdStart(false);

      if (result) {
        const apiSlaHours = result.slaHours || (result.createdAt && result.slaDeadline
          ? Math.max(1, Math.round((new Date(result.slaDeadline).getTime() - new Date(result.createdAt).getTime()) / 3600000))
          : null);
        const slaTotal = apiSlaHours ? `${apiSlaHours} Hours` : '—';
        const mappedResult = {
          ...result,
          id: result.complaintId || result.id,
          ticketCode: result.complaintId || result.id,
          title: result.title || 'Civic Issue',
          category: (result.category || '').replace(/-+$/, '').trim(),
          subcategory: (result.subCategory || result.subcategory || '').replace(/-+$/, '').trim(),
          description: result.description || '',
          status: result.status || 'Submitted',
          date: result.createdAt ? new Date(result.createdAt).toLocaleDateString() : '',
          time: result.createdAt ? new Date(result.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '',
          district: result.district || 'Rajasthan',
          ulb: result.ulbName || result.ulb || '',
          ward: result.wardNumber || result.ward || '',
          areaColony: result.areaColony || '',
          address: result.address || '',
          dept: result.departmentName || result.department || 'Municipal Administration',
          departmentName: result.departmentName || result.department || 'Municipal Administration',
          priority: result.priority || 'Normal',
          slaTotal,
          slaHours: apiSlaHours,
          slaDeadline: result.slaDeadline,
          resolvedAt: result.resolvedAt,
          closedAt: result.closedAt,
          citizenId: result.citizenId,
          citizenName: result.citizenName,
          citizenEmail: result.citizenEmail,
          citizenPhone: result.citizenPhone,
          assignedOfficerId: result.assignedOfficerId,
          assignedOfficerName: result.assignedOfficerName,
          remarks: result.remarks || '',
          timeline: result.timeline || []
        };
        setTrackingResult(mappedResult);
        setTrackID(query);
        setFeedbackRating(result.rating || 5);
        setFeedbackComment(result.feedback || '');
        if (result.status === 'Closed' || (result.rating && result.rating > 0)) {
          setFeedbackSubmitted(true);
        }

        // Lazy-load photo evidence lazily
        setLazyPhoto(null);
        setLazyPhotoLoading(true);
        getComplaintPhoto(query)
          .then(photoRes => {
            if (photoRes && photoRes.hasPhoto && photoRes.photo) {
              setLazyPhoto(photoRes.photo);
            }
          })
          .catch(err => {
            console.warn("Lazy photo load error:", err);
          })
          .finally(() => {
            setLazyPhotoLoading(false);
          });
      } else {
        setTrackError('Grievance file not found. Please verify the Ticket Code / Complaint ID.');
        setTrackingResult(null);
      }
    } catch (err) {
      clearTimeout(coldStartTimer);
      setTrackColdStart(false);
      console.error("Tracking lookup failed:", err);
      const msg = err.message || '';
      if (msg.includes('404') || msg.toLowerCase().includes('not found')) {
        setTrackError('Grievance file not found. Please verify the Ticket Code / Complaint ID.');
      } else if (msg.includes('403') || msg.toLowerCase().includes('forbidden')) {
        setTrackError('Access forbidden: you do not have permission to view this complaint.');
      } else if (msg.includes('401') || msg.toLowerCase().includes('unauthorized')) {
        setTrackError('Please log in to track this complaint.');
      } else {
        setTrackError(msg || 'Could not fetch grievance status. Please retry.');
      }
      setTrackingResult(null);
    } finally {
      setTrackLoading(false);
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
    if (!trackingResult || !trackingResult.id) return;
    setLoading(true);
    try {
      await submitFeedback(trackingResult.id, feedbackRating, feedbackComment);
      setFeedbackSubmitted(true);
      setTrackingResult(prev => ({
        ...prev,
        status: 'Closed',
        rating: feedbackRating,
        feedback: feedbackComment
      }));
    } catch (err) {
      console.error("Feedback submission failed:", err);
      alert("Failed to submit feedback: " + (err.message || 'Please try again'));
    } finally {
      setLoading(false);
    }
  };

  const faqData = [
    { q: 'Is citizen personal identity protected?', a: 'Yes, citizen contact details are protected and only accessible to authorized municipal officials.' },
    { q: 'What happens if my category selection is wrong?', a: 'The system has an intelligent routing override. The receiving Ward Officer can re-route the case to the correct department with a single click, which instantly resets the SLA clock.' },
    { q: 'How does the resolution timeline work?', a: 'Every complaint category has a defined resolution timeline based on its priority.' },
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
              { title: 'Report New Complaint', desc: 'Register a new civic issue with municipal address & photos.', icon: 'bi-megaphone', target: 'submit', color: 'border-success hover-success' },
              { title: 'Track Complaint', desc: 'Lookup existing complaint lifecycle & officer remarks.', icon: 'bi-compass', target: 'track', color: 'border-primary hover-primary' },
              { title: 'Reopen Complaint', desc: 'Reopen cases marked completed with fake/unstable proofs.', icon: 'bi-arrow-counterclockwise', target: 'reopen', color: 'border-warning hover-warning' }
            ].map((act, idx) => (
              <div className="col-sm-6 col-lg-3" key={idx}>
                <div 
                  className={`card rc-card border border-light p-3 shadow-sm cursor-pointer h-100 d-flex flex-column justify-content-between ${act.color}`}
                  onClick={() => {
                    if (act.target === 'track' && setActivePage) {
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
                            type="tel"
                            inputMode="numeric"
                            maxLength={Math.max(10, (formData.mobile || '').length)}
                            autoComplete="tel-national"
                            required
                            value={formData.mobile} 
                            onKeyDown={handleMobileKeyDown}
                            onPaste={(e) => {
                              e.preventDefault();
                              const pasted = e.clipboardData ? e.clipboardData.getData('text') : '';
                              const normalized = normalizeMobile(pasted);
                              setFormData(prev => ({ ...prev, mobile: normalized }));
                              setMobileTouched(true);
                            }}
                            onChange={(e) => {
                              setMobileTouched(true);
                              const normalized = normalizeMobile(e.target.value);
                              setFormData(prev => ({ ...prev, mobile: normalized }));
                            }}
                            onBlur={() => setMobileTouched(true)}
                            className={`form-control rc-form-control p-3 bg-light border-0 rounded-3 text-secondary ${mobileError ? 'border border-danger' : ''}`}
                            placeholder="Enter active 10-digit mobile" 
                          />
                          {mobileError && (
                            <div className="text-danger small mt-1 fw-semibold animate-fade-in" style={{ fontSize: '0.75rem' }}>
                              <i className="bi bi-exclamation-circle me-1"></i>{mobileError}
                            </div>
                          )}
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
                          disabled={!formData.name || !isValidMobile(formData.mobile, true)}
                          onClick={() => setCurrentStep(2)} 
                          className="btn rc-btn-primary px-4 py-2"
                        >
                          Next: Location Selection <i className="bi bi-chevron-right ms-1"></i>
                        </button>
                      </div>
                    </div>
                  )}

                  {/* STEP 2: MUNICIPAL LOCATION SELECTION */}
                  {currentStep === 2 && (
                    <div className="animate-fade-in">
                      <div className="d-flex justify-content-between align-items-center mb-3">
                        <h6 className="fw-bold text-secondary m-0">2. Municipal Jurisdiction & Location</h6>
                        <span className="badge bg-primary-soft text-primary border border-primary border-opacity-10 py-1 px-2.5 rounded" style={{ fontSize: '0.62rem' }}>
                          <i className="bi bi-geo-alt-fill me-1"></i> Verified Rajasthan ULBs
                        </span>
                      </div>

                      {/* Location Mode Toggle: Manual Entry (Main Path) & OpenStreetMap Picker */}
                      <div className="row g-2 mb-4">
                        <div className="col-6">
                          <button 
                            type="button"
                            className={`btn w-100 rounded-3 py-2.5 d-flex flex-column align-items-center gap-1 transition-all border ${
                              locationMethod === 'manual' 
                                ? 'btn-success text-white shadow-sm border-success' 
                                : 'btn-outline-secondary bg-light text-secondary border-light hover-light'
                            }`}
                            onClick={() => { setLocationMethod('manual'); setLocationSource('MANUAL_ENTRY'); setShowMapPicker(false); }}
                          >
                            <i className="bi bi-pencil-square fs-5"></i>
                            <span className="fw-bold" style={{ fontSize: '0.72rem' }}>Manual Entry (Main Path)</span>
                          </button>
                        </div>
                        <div className="col-6">
                          <button 
                            type="button"
                            className={`btn w-100 rounded-3 py-2.5 d-flex flex-column align-items-center gap-1 transition-all border ${
                              locationMethod === 'map' 
                                ? 'btn-success text-white shadow-sm border-success' 
                                : 'btn-outline-secondary bg-light text-secondary border-light hover-light'
                            }`}
                            onClick={() => { setLocationMethod('map'); setLocationSource('MAP_SELECTION'); setShowMapPicker(true); }}
                          >
                            <i className="bi bi-map fs-5"></i>
                            <span className="fw-bold" style={{ fontSize: '0.72rem' }}>Choose on Map</span>
                          </button>
                        </div>
                      </div>

                      {/* Interactive OpenStreetMap Leaflet Picker */}
                      {showMapPicker && (
                        <div className="mb-4 animate-fade-in">
                          <div className="d-flex justify-content-between align-items-center mb-2">
                            <span className="text-muted small fw-bold" style={{ fontSize: '0.72rem' }}>
                              <i className="bi bi-map-fill text-success me-1"></i>
                              Click on map to pin location. Drag marker to adjust.
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
                            center={markerPosition || mapCenter}
                            zoom={13}
                            markerPosition={markerPosition}
                            onLocationSelect={handleMapLocationSelect}
                            height="280px"
                          />
                          {coordinates.lat && (
                            <div className="mt-2 text-start">
                              <span className="badge bg-success-soft text-success small">
                                <i className="bi bi-geo-alt-fill me-1"></i> Pinned: {coordinates.lat.toFixed(5)}, {coordinates.lng.toFixed(5)}
                              </span>
                            </div>
                          )}
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
                        <h6 className="fw-bold text-secondary m-0">3. Category Selection & Description</h6>
                      </div>

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
                          <div className="col-4"><span className="d-block text-muted">Entry Mode:</span><strong className="text-secondary">{locationMethod === 'map' && coordinates.lat ? `Map (${coordinates.lat.toFixed(4)}, ${coordinates.lng.toFixed(4)})` : 'Manual ULB'}</strong></div>
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
                          <div className="col-4"><span className="d-block text-muted">Priority:</span><strong className="text-secondary">{formData.priority || 'Normal'}</strong></div>
                          <div className="col-4"><span className="d-block text-muted">SLA Target:</span><strong className="text-success">{formData.priority === 'Emergency' ? '2 Hours' : formData.priority === 'Critical' ? '6 Hours' : formData.priority === 'High' ? '12 Hours' : '48 Hours'}</strong></div>
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
                    <strong className="text-success">{formData.priority === 'Emergency' ? '2 Hours' : formData.priority === 'Critical' ? '6 Hours' : formData.priority === 'High' ? '12 Hours' : '48 Hours'}</strong>
                  </div>
                  <div className="p-2.5 rounded-3 bg-light border border-light">
                    <span className="text-muted d-block small">Assigned Municipal Dept</span>
                    <strong className="text-secondary">{currentCategoryMeta.dept}</strong>
                  </div>
                  <div className="p-2.5 rounded-3 bg-light border border-light">
                    <span className="text-muted d-block small">Priority System Rating</span>
                    <span className={`badge ${formData.priority === 'Critical' || formData.priority === 'Emergency' ? 'bg-danger' : formData.priority === 'High' ? 'bg-warning' : 'bg-success'} text-white py-1 px-2.5 mt-1 small rounded-pill fw-bold`}>
                      {formData.priority || 'Normal'}
                    </span>
                  </div>
                  <div className="p-2.5 rounded-3 bg-light border border-light">
                    <span className="text-muted d-block small">Supervising Authority</span>
                    <strong className="text-primary small" style={{ fontSize: '0.7rem' }}>Department Nodal Officer</strong>
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
                  Your civic issue has been registered. The system automatically routed it to the {successDetails.ulb || successDetails.district || 'Rajasthan'} municipal office.
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
                  <button 
                    onClick={() => {
                      const targetId = successDetails.id;
                      setIsSubmitted(false);
                      setActiveSection('track');
                      setTrackID(targetId);
                      sessionStorage.setItem('rajcivic_pending_track_id', targetId);
                      if (setActivePage) {
                        setActivePage('Track Complaint');
                      }
                      handleTrackSearch(null, targetId);
                    }} 
                    className="btn btn-success text-white py-2.5 px-4 shadow-sm fw-bold"
                  >
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

              </div>
            </div>
          </div>
        )}

        {/* 9. Track Complaint Section & 10. Real Lifecycle Preview */}
        {(activeSection === 'track' || showOnlyTrack) && !isSubmitted && (
          <div className="row justify-content-center text-start animate-slide-up">
            <div className="col-lg-10">
              <div className="card border-0 rounded-4 shadow-sm p-4 bg-white mb-4">
                <h5 className="fw-bold text-secondary mb-4 border-bottom pb-2">
                  <i className="bi bi-compass-fill text-success me-2"></i>
                  Track Existing Complaint Status
                </h5>

                {trackColdStart && (
                  <div className="alert alert-info py-2 px-3 rounded-3 small mb-3 animate-fade-in d-flex align-items-center gap-2">
                    <span className="spinner-border spinner-border-sm text-info" role="status"></span>
                    <span>Server is waking up, please wait... (initial request may take a few seconds)</span>
                  </div>
                )}

                {trackError && (
                  <div className="alert alert-danger py-2 px-3 rounded-3 small mb-3 animate-fade-in d-flex align-items-center gap-2">
                    <i className="bi bi-exclamation-triangle-fill text-danger"></i>
                    <span>{trackError}</span>
                  </div>
                )}

                <form onSubmit={handleTrackSearch} className="row g-3 align-items-end mb-4">
                  <div className="col-md-7">
                    <label className="form-label small fw-bold text-secondary">Complaint ID / Ticket Code *</label>
                    <input 
                      type="text" required value={trackID} 
                      disabled={trackLoading}
                      onChange={(e) => setTrackID(e.target.value)}
                      className="form-control rc-form-control p-3 bg-light border-0 rounded-3 text-secondary" placeholder="E.g. RJCIVIC-JOD-NNJ-2026-0001" 
                    />
                  </div>
                  <div className="col-md-5">
                    <button type="submit" className="btn rc-btn-primary w-100 py-2.5" disabled={trackLoading || !trackID.trim()}>
                      {trackLoading ? (
                        <>
                          <span className="spinner-border spinner-border-sm me-2" role="status"></span>
                          Checking Status...
                        </>
                      ) : (
                        'Track Complaint Status'
                      )}
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
                              title: trackingResult.title,
                              category: trackingResult.category,
                              subcategory: trackingResult.subcategory,
                              sla: trackingResult.slaTotal,
                              slaDeadline: trackingResult.slaDeadline,
                              dept: trackingResult.dept,
                              ulb: trackingResult.ulb,
                              ward: trackingResult.ward,
                              district: trackingResult.district,
                              address: trackingResult.address,
                              status: trackingResult.status,
                              priority: trackingResult.priority,
                              createdAt: trackingResult.createdAt,
                              assignedOfficerId: trackingResult.assignedOfficerId,
                              assignedOfficerName: trackingResult.assignedOfficerName,
                              timeline: trackingResult.timeline
                            });
                            setShowReceipt(true);
                          }}
                          className="btn btn-sm btn-outline-success rounded-pill px-3 py-1 fw-bold d-flex align-items-center gap-1 text-xxs"
                          style={{ fontSize: '0.72rem' }}
                        >
                          <i className="bi bi-file-earmark-arrow-down-fill text-success"></i> Download e-Slip
                        </button>
                        <button 
                          onClick={() => handleTrackSearch(null, trackingResult.id)}
                          disabled={trackLoading}
                          className="btn btn-sm btn-outline-secondary rounded-pill px-3 py-1 fw-bold d-flex align-items-center gap-1 text-xxs"
                          style={{ fontSize: '0.72rem' }}
                          title="Refresh data from server"
                        >
                          <i className={`bi bi-arrow-clockwise ${trackLoading ? 'spin' : ''}`}></i> Refresh
                        </button>
                      </div>
                      
                      {/* Real SLA Countdown Box */}
                      <span className={`badge ${slaInfo.badgeClass} border border-opacity-10 py-2 px-3 rounded-pill fw-bold small`}>
                        <i className="bi bi-clock-history me-1 animate-pulse"></i>
                        {slaInfo.statusText || 'SLA Active'}
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
                            <div><span className="text-muted">Category:</span> <span className="badge bg-primary-soft text-primary rounded-pill px-2 py-0.5">{trackingResult.category}{trackingResult.subcategory ? ` • ${trackingResult.subcategory}` : ''}</span></div>
                            <div><span className="text-muted">Description:</span> <p className="text-muted text-xxs mb-0 mt-0.5" style={{ lineHeight: '1.4' }}>{trackingResult.description || 'No description provided.'}</p></div>
                            <div><span className="text-muted">Submitted Timestamp:</span> <strong className="text-secondary">{trackingResult.date} at {trackingResult.time}</strong></div>
                            <div><span className="text-muted">District / ULB:</span> <strong className="text-secondary">{trackingResult.district || 'Rajasthan'} - {trackingResult.ulb || 'ULB'}</strong></div>
                            <div><span className="text-muted">Ward / Address:</span> <strong className="text-secondary">{trackingResult.ward || ''} {trackingResult.address ? `(${trackingResult.address})` : ''}</strong></div>
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
                              <strong className="text-secondary">{trackingResult.slaTotal} ({trackingResult.priority} Priority)</strong>
                            </div>
                            <div className="d-flex justify-content-between">
                              <span className="text-muted">Remaining Time:</span>
                              <strong className={slaInfo.isOverdue ? 'text-danger fw-bold' : 'text-primary'}>{slaInfo.remainingText || 'Calculating...'}</strong>
                            </div>
                            <div className="d-flex justify-content-between border-top pt-2">
                              <span className="text-muted">SLA Status:</span>
                              <span className={`badge ${slaInfo.isComplete ? 'bg-success-soft text-success' : slaInfo.isOverdue ? 'bg-danger-soft text-danger' : 'bg-primary-soft text-primary'} rounded-pill fw-bold`}>
                                {slaInfo.label}
                              </span>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* C. Operational Timeline Panel (4 Real Stages) */}
                    <div className="card border-0 p-3 bg-light rounded-3 mb-4 text-start">
                      <div className="d-flex justify-content-between align-items-center mb-3">
                        <strong className="text-secondary small text-uppercase font-semibold" style={{ letterSpacing: '0.05em', fontSize: '0.68rem' }}>
                          <i className="bi bi-clock-history text-primary"></i> C. Complaint Operational Lifecycle (4 Stages)
                        </strong>
                        {((trackingResult.status === 'Reopened') || (trackingResult.timeline && trackingResult.timeline.some(t => t.status === 'Reopened'))) && (
                          <span className="badge bg-warning text-dark fw-bold small">
                            <i className="bi bi-arrow-counterclockwise me-1"></i> Reopened Case
                          </span>
                        )}
                      </div>
                      
                      <div className="row g-2 text-center">
                        {stages.map((st, idx) => {
                          const currentStageIdx = trackingResult.status === 'Closed' ? 3
                            : trackingResult.status === 'Resolved' ? 2
                            : (trackingResult.status === 'InProgress' || trackingResult.status === 'In Progress') ? 1
                            : 0; // Submitted
                          const isCompleted = idx < currentStageIdx;
                          const isCurrent = idx === currentStageIdx;
                          
                          const circleStyle = isCurrent 
                            ? 'bg-primary text-white pulse-glow border-primary' 
                            : isCompleted 
                            ? 'bg-success text-white border-success' 
                            : 'bg-white text-muted border';

                          const textClass = isCurrent 
                            ? 'text-primary fw-bold' 
                            : isCompleted 
                            ? 'text-success fw-semibold' 
                            : 'text-muted';

                          // Find timestamp from timeline
                          const stageTime = (() => {
                            if (!trackingResult.timeline || trackingResult.timeline.length === 0) {
                              if (st.key === 'Submitted' && trackingResult.createdAt) return new Date(trackingResult.createdAt).toLocaleDateString();
                              return '';
                            }
                            const match = trackingResult.timeline.find(t => {
                              if (st.key === 'Submitted') return t.status === 'Submitted';
                              if (st.key === 'InProgress') return t.status === 'InProgress' || t.status === 'In Progress';
                              if (st.key === 'Resolved') return t.status === 'Resolved';
                              if (st.key === 'Closed') return t.status === 'Closed';
                              return false;
                            });
                            return match && match.timestamp ? new Date(match.timestamp).toLocaleDateString() : '';
                          })();

                          return (
                            <div className="col-6 col-md-3" key={idx}>
                              <div className="d-flex flex-column align-items-center">
                                <div 
                                  className={`rounded-circle d-flex align-items-center justify-content-center shadow-sm fw-bold ${circleStyle}`}
                                  style={{ width: '32px', height: '32px', fontSize: '0.75rem', zIndex: 2 }}
                                >
                                  {isCompleted ? <i className="bi bi-check-lg" style={{ fontSize: '0.8rem' }}></i> : idx + 1}
                                </div>
                                <span className={`mt-1.5 d-block text-xxs ${textClass}`} style={{ fontSize: '0.7rem', lineHeight: '1.2' }}>{st.title}</span>
                                {stageTime && <span className="text-muted text-xxs mt-0.5" style={{ fontSize: '0.6rem' }}>{stageTime}</span>}
                              </div>
                            </div>
                          );
                        })}
                      </div>

                      {((trackingResult.status === 'Reopened') || (trackingResult.timeline && trackingResult.timeline.some(t => t.status === 'Reopened'))) && (
                        <div className="alert alert-warning py-1.5 px-3 rounded-3 small mt-3 mb-0 d-flex align-items-center gap-2">
                          <i className="bi bi-arrow-counterclockwise text-danger fw-bold"></i>
                          <span><strong>Case Reopened:</strong> Citizen requested additional inspection / corrective action.</span>
                        </div>
                      )}
                    </div>

                    {/* D & E Assigned Administration and G. Municipal Incident Location */}
                    <div className="row g-3.5 text-start mb-4">
                      
                      {/* Assigned Administration */}
                      <div className="col-md-6">
                        <div className="card border-0 p-3 bg-white border border-light rounded-3 h-100 shadow-xxs">
                          <strong className="text-secondary small d-block mb-3 text-uppercase font-semibold" style={{ letterSpacing: '0.05em', fontSize: '0.68rem' }}>
                            <i className="bi bi-shield-shaded text-primary"></i> Assigned Administration
                          </strong>
                          
                          <div className="d-flex flex-column gap-3 small">
                            <div className="d-flex align-items-start gap-2 border-bottom pb-2">
                              <div className="bg-primary-soft text-primary rounded-circle p-1.5 d-flex align-items-center justify-content-center" style={{ width: '28px', height: '28px' }}>
                                <i className="bi bi-building"></i>
                              </div>
                              <div>
                                <span className="text-muted text-xxs d-block" style={{ fontSize: '0.6rem' }}>Jurisdiction ULB & Department</span>
                                <strong className="text-secondary">{trackingResult.ulb || 'Rajasthan ULB'} • {trackingResult.departmentName || trackingResult.dept}</strong>
                              </div>
                            </div>

                            <div className="d-flex align-items-start gap-2">
                              <div className="bg-success-soft text-success rounded-circle p-1.5 d-flex align-items-center justify-content-center" style={{ width: '28px', height: '28px' }}>
                                <i className="bi bi-person-fill-check"></i>
                              </div>
                              <div>
                                <span className="text-muted text-xxs d-block" style={{ fontSize: '0.6rem' }}>Assigned Officer</span>
                                <strong className="text-secondary d-block">
                                  {trackingResult.assignedOfficerName || `Not assigned yet — handled by ${trackingResult.departmentName || trackingResult.dept || 'Department'}`}
                                </strong>
                                {(() => {
                                  const latestTimeline = trackingResult.timeline && trackingResult.timeline.length > 0
                                    ? trackingResult.timeline[trackingResult.timeline.length - 1]
                                    : null;
                                  if (latestTimeline) {
                                    return (
                                      <span className="text-muted text-xxs d-block" style={{ fontSize: '0.6rem' }}>
                                        Last updated by {latestTimeline.updatedBy || 'Staff'} on {latestTimeline.timestamp ? new Date(latestTimeline.timestamp).toLocaleString() : 'recently'}
                                      </span>
                                    );
                                  }
                                  return null;
                                })()}
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* G. Municipal Incident Location & GIS Map Preview */}
                      <div className="col-md-6">
                        <div className="card border-0 p-3 bg-white border border-light rounded-3 h-100 shadow-xxs">
                          <strong className="text-secondary small d-block mb-2 text-uppercase font-semibold" style={{ letterSpacing: '0.05em', fontSize: '0.68rem' }}>
                            <i className="bi bi-geo-alt-fill text-danger"></i> G. Municipal Incident Location &amp; GIS Map
                          </strong>
                          {trackingResult.latitude && trackingResult.longitude ? (
                            <div className="badge bg-primary-soft text-primary mb-2 align-self-start fw-semibold" style={{ fontSize: '0.7rem' }}>
                              <i className="bi bi-geo-alt-fill me-1"></i> Exact Incident Pin ({Number(trackingResult.latitude).toFixed(4)}, {Number(trackingResult.longitude).toFixed(4)})
                            </div>
                          ) : (
                            <div className="badge bg-warning-soft text-warning mb-2 align-self-start fw-semibold" style={{ fontSize: '0.7rem' }}>
                              <i className="bi bi-info-circle-fill me-1"></i> Approximate location (district centre)
                            </div>
                          )}
                          <div className="d-flex flex-column gap-2 small">
                            <div><span className="text-muted">District:</span> <strong className="text-secondary">{trackingResult.district || 'Rajasthan'}</strong></div>
                            <div><span className="text-muted">ULB / City:</span> <strong className="text-secondary">{trackingResult.ulb || '—'}</strong></div>
                            <div><span className="text-muted">Ward / Colony:</span> <strong className="text-secondary">{trackingResult.ward || trackingResult.areaColony || '—'}</strong></div>
                            <div><span className="text-muted">Registered Address:</span> <p className="text-secondary small mb-0 mt-0.5">{trackingResult.address || trackingResult.fullAddress || 'Site address recorded upon lodgement.'}</p></div>
                          </div>
                          <div className="mt-3 rounded-3 overflow-hidden border">
                            <MapPicker
                              center={trackingResult.latitude && trackingResult.longitude ? [trackingResult.latitude, trackingResult.longitude] : [26.9124, 75.7873]}
                              zoom={trackingResult.latitude && trackingResult.longitude ? 14 : 11}
                              markerPosition={trackingResult.latitude && trackingResult.longitude ? [trackingResult.latitude, trackingResult.longitude] : null}
                              onLocationSelect={() => {}}
                              height="170px"
                            />
                          </div>
                        </div>
                      </div>

                    </div>

                    {/* H. Proof Section & I. Officer Remarks */}
                    <div className="row g-3.5 text-start mb-4">
                      
                      {/* H. Physical Ground Proof Verification */}
                      <div className="col-md-7">
                        <div className="card border-0 p-3 bg-light rounded-3 h-100 shadow-xxs">
                          <strong className="text-secondary small d-block mb-3.5 text-uppercase font-semibold" style={{ letterSpacing: '0.05em', fontSize: '0.68rem' }}>
                            <i className="bi bi-images text-primary"></i> H. Physical Ground Proof Verification
                          </strong>
                          
                          {lazyPhotoLoading ? (
                            <div className="p-4 text-center text-muted small">
                              <span className="spinner-border spinner-border-sm me-2 text-primary" role="status"></span>
                              Loading ground photo evidence...
                            </div>
                          ) : lazyPhoto ? (
                            <div className="bg-dark rounded p-2 text-center text-white position-relative overflow-hidden" style={{ minHeight: '160px' }}>
                              <img src={lazyPhoto} alt="Grievance Ground Proof" className="w-100 rounded object-fit-contain" style={{ maxHeight: '240px' }} />
                              <span className="text-white d-block small mt-1">Submitted Incident Photo</span>
                            </div>
                          ) : (
                            <div className="p-4 text-center text-muted small bg-white rounded-3 border">
                              <i className="bi bi-camera-slash fs-3 text-secondary opacity-50 d-block mb-1"></i>
                              <span>No ground photo attached to this grievance ticket.</span>
                            </div>
                          )}
                        </div>
                      </div>

                      {/* I. Officer Remarks & Logs */}
                      <div className="col-md-5">
                        <div className="card border-0 p-3 bg-white border border-light rounded-3 h-100 shadow-xxs">
                          <strong className="text-secondary small d-block mb-2 text-uppercase font-semibold" style={{ letterSpacing: '0.05em', fontSize: '0.68rem' }}>
                            <i className="bi bi-chat-left-dots text-primary"></i> I. Officer Remarks & Audit Log
                          </strong>
                          <div className="bg-light p-2.5 rounded-3 border border-light mb-3">
                            <span className="text-muted d-block text-xxs" style={{ fontSize: '0.6rem' }}>LATEST REMARKS</span>
                            <p className="text-secondary small fw-semibold mt-1 mb-0" style={{ lineHeight: '1.4', fontSize: '0.72rem' }}>
                              "{trackingResult.remarks || 'No officer remarks logged yet.'}"
                            </p>
                          </div>
                          {trackingResult.timeline && trackingResult.timeline.length > 0 && (
                            <div className="overflow-auto" style={{ maxHeight: '180px' }}>
                              <span className="text-muted d-block text-xxs mb-1" style={{ fontSize: '0.6rem' }}>ACTIVITY TIMELINE</span>
                              <ul className="list-unstyled mb-0 small">
                                {trackingResult.timeline.map((item, idx) => (
                                  <li key={idx} className="border-bottom pb-1 mb-1" style={{ fontSize: '0.7rem' }}>
                                    <span className="badge bg-secondary-soft text-secondary me-1">{item.status}</span>
                                    <span className="text-muted">{item.description}</span>
                                    <span className="text-muted d-block text-xxs">{item.updatedBy || 'Staff'} • {item.timestamp ? new Date(item.timestamp).toLocaleString() : ''}</span>
                                  </li>
                                ))}
                              </ul>
                            </div>
                          )}
                        </div>
                      </div>

                    </div>

                    {/* J. Citizen Feedback / Reopen Complaint Option */}
                    {(() => {
                      const isResolvedOrClosed = trackingResult.status === 'Resolved' || trackingResult.status === 'Closed';
                      const isOwner = authenticatedUser && (
                        (trackingResult.citizenId && String(authenticatedUser.id) === String(trackingResult.citizenId)) ||
                        (authenticatedUser.email && trackingResult.citizenEmail && authenticatedUser.email.toLowerCase() === trackingResult.citizenEmail.toLowerCase())
                      );
                      if (!isResolvedOrClosed || !isOwner) {
                        return null;
                      }

                      return (
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
                              <strong className="text-secondary small d-block">Feedback Recorded Successfully!</strong>
                              <span className="text-muted d-block text-xxs" style={{ fontSize: '0.65rem' }}>
                                Rating: {feedbackRating} / 5 Stars {feedbackComment ? `— "${feedbackComment}"` : ''}
                              </span>
                            </div>
                          ) : (
                            <div>
                              <p className="text-muted small mb-3">
                                Municipal records show work on this issue is completed. Please rate your satisfaction:
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
                                  <i className="bi bi-shield-fill-check me-1"></i> Submit Citizen Feedback
                                </button>
                                <button 
                                  onClick={() => {
                                    setReopenData((prev) => ({ ...prev, id: trackingResult.id }));
                                    setActiveSection('reopen');
                                  }}
                                  className="btn btn-outline-danger btn-sm px-4 rounded-pill fw-bold"
                                >
                                  <i className="bi bi-arrow-counterclockwise me-1"></i> Request Reopen
                                </button>
                              </div>
                            </div>
                          )}
                        </div>
                      );
                    })()}

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
                          <option value="Issue unresolved on site">Issue unresolved on site</option>
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

        {/* Government e-Slip print receipt overlay modal */}
        {showReceipt && successDetails && (
          <div className="printable-slip-overlay position-fixed top-0 start-0 w-100 h-100 bg-dark bg-opacity-75 d-flex align-items-center justify-content-center p-3" style={{ zIndex: 1050 }}>
            <div className="printable-slip-card card p-4 rounded-4 shadow-lg text-start border-0 animate-scale-up" style={{ width: '560px', maxWidth: '100%', background: '#fff', borderLeft: '8px solid #0f4c81' }}>
              <div className="d-flex justify-content-between align-items-center border-bottom pb-2 mb-3">
                <div>
                  <strong className="text-secondary small d-block">GOVERNMENT OF RAJASTHAN</strong>
                  <span className="text-muted text-xxs" style={{ fontSize: '0.62rem' }}>Department of Local Self Government • RajCivic Portal</span>
                </div>
                <button onClick={() => setShowReceipt(false)} className="btn btn-close btn-sm no-print" aria-label="Close"></button>
              </div>

              {/* Printable body */}
              <div className="position-relative border p-3 rounded bg-light" style={{ minHeight: '260px' }}>
                <div className="position-relative z-1">
                  <h6 className="fw-bold text-secondary mb-2 text-center">OFFICIAL CIVIC COMPLAINT e-SLIP</h6>
                  
                  <div className="d-flex justify-content-between align-items-center mb-2">
                    <span className="text-xxs text-muted" style={{ fontSize: '0.65rem' }}>Receipt: eSLIP-{successDetails.id}</span>
                    <span className="text-xxs text-muted" style={{ fontSize: '0.65rem' }}>Date: {new Date().toLocaleDateString('en-IN')}</span>
                  </div>

                  <div className="row g-2 small border-top pt-2" style={{ fontSize: '0.75rem' }}>
                    <div className="col-6"><strong>Complaint ID:</strong><br /><span className="text-primary fw-bold">{successDetails.id}</span></div>
                    <div className="col-6"><strong>Current Status:</strong><br /><span className="badge bg-success-soft text-success">{successDetails.status || 'Submitted'}</span></div>
                    <div className="col-6"><strong>Subject / Title:</strong><br />{successDetails.title || 'Civic Issue'}</div>
                    <div className="col-6"><strong>Priority:</strong><br />{successDetails.priority || 'Normal'}</div>
                    <div className="col-6"><strong>Category:</strong><br />{successDetails.category || 'General'}</div>
                    <div className="col-6"><strong>Department:</strong><br />{successDetails.dept || 'Local Self Government'}</div>
                    <div className="col-6"><strong>District / ULB:</strong><br />{successDetails.district || 'Rajasthan'} - {successDetails.ulb || 'ULB'}</div>
                    <div className="col-6"><strong>Ward / Landmark:</strong><br />{successDetails.ward || ''} {successDetails.address ? `(${successDetails.address})` : ''}</div>
                    <div className="col-6"><strong>Assigned Officer:</strong><br /><span>{successDetails.assignedOfficerName || 'Not assigned yet'}</span></div>
                    <div className="col-6"><strong>Submitted On:</strong><br />{successDetails.createdAt ? new Date(successDetails.createdAt).toLocaleString('en-IN') : new Date().toLocaleString('en-IN')}</div>
                    <div className="col-6"><strong>SLA Target:</strong><br /><span className="text-danger fw-bold">{successDetails.slaDeadline ? new Date(successDetails.slaDeadline).toLocaleString('en-IN') : (successDetails.sla || '48 Hours')}</span></div>
                  </div>

                  {successDetails.timeline && successDetails.timeline.length > 0 && (
                    <div className="mt-2 border-top pt-2">
                      <strong className="text-xxs text-secondary text-uppercase d-block mb-1" style={{ fontSize: '0.65rem' }}>Status Log:</strong>
                      <div className="small" style={{ fontSize: '0.68rem' }}>
                        {successDetails.timeline.slice(-3).map((t, idx) => (
                          <div key={idx} className="text-muted">
                            • <strong>{t.status}</strong>: {t.description || t.title} ({t.updatedBy || 'Staff'})
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Digital sign and QR Code */}
                  <div className="d-flex align-items-end justify-content-between border-top pt-2 mt-3">
                    <div>
                      <i className="bi bi-patch-check-fill text-success me-1"></i>
                      <span className="text-xxs text-success fw-bold" style={{ fontSize: '0.65rem' }}>OFFICIALLY VERIFIED</span>
                      <span className="text-muted d-block text-xxs" style={{ fontSize: '0.55rem' }}>Government of Rajasthan Civic Portal</span>
                    </div>
                    <div className="border p-1 bg-white" style={{ width: '42px', height: '42px' }}>
                      <i className="bi bi-qr-code text-dark fs-4"></i>
                    </div>
                  </div>
                </div>
              </div>

              <div className="d-flex gap-2 mt-3 no-print">
                <button onClick={() => window.print()} className="btn btn-primary flex-grow-1 py-2 small fw-bold">
                  <i className="bi bi-printer-fill me-1"></i> Print / Save as PDF
                </button>
                <button onClick={() => setShowReceipt(false)} className="btn btn-outline-secondary py-2 small fw-bold">
                  Close
                </button>
              </div>
            </div>
          </div>
        )}

      </div>
    </section>
  );
}
