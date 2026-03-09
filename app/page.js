'use client'

import { useState, useEffect, useRef } from 'react'
import html2canvas from 'html2canvas'
import JSZip from 'jszip'

const THEMES = {
  'dark-purple': {
    bg: 'linear-gradient(160deg, #1a0533 0%, #0d0d1a 60%, #2a1050 100%)',
    accent: '#b39dff', text: '#fff', sub: 'rgba(255,255,255,0.65)',
    badge_bg: 'rgba(124,92,252,0.25)', num: 'rgba(255,255,255,0.1)'
  },
  'neon-dark': {
    bg: 'linear-gradient(160deg, #050f0a 0%, #000 60%, #001a0d 100%)',
    accent: '#00ff88', text: '#fff', sub: 'rgba(255,255,255,0.65)',
    badge_bg: 'rgba(0,255,136,0.15)', num: 'rgba(0,255,136,0.12)'
  },
  'sunset': {
    bg: 'linear-gradient(160deg, #1a0a00 0%, #0d0500 60%, #2a0e00 100%)',
    accent: '#ff8c42', text: '#fff', sub: 'rgba(255,255,255,0.65)',
    badge_bg: 'rgba(255,140,66,0.2)', num: 'rgba(255,140,66,0.12)'
  },
  'pink-dark': {
    bg: 'linear-gradient(160deg, #1a001a 0%, #0d000d 60%, #2a0020 100%)',
    accent: '#fc5c7d', text: '#fff', sub: 'rgba(255,255,255,0.65)',
    badge_bg: 'rgba(252,92,125,0.2)', num: 'rgba(252,92,125,0.12)'
  },
  'ocean': {
    bg: 'linear-gradient(160deg, #001233 0%, #000a1f 60%, #001a40 100%)',
    accent: '#4ea8ff', text: '#fff', sub: 'rgba(255,255,255,0.65)',
    badge_bg: 'rgba(78,168,255,0.2)', num: 'rgba(78,168,255,0.12)'
  },
  'clean-white': {
    bg: 'linear-gradient(160deg, #ffffff 0%, #f5f5f5 100%)',
    accent: '#1a1a2e', text: '#0c0c0f', sub: 'rgba(0,0,0,0.55)',
    badge_bg: 'rgba(0,0,0,0.07)', num: 'rgba(0,0,0,0.08)'
  }
}

export default function Home() {
  const [currentSlides, setCurrentSlides] = useState([])
  const [editingIndex, setEditingIndex] = useState(null)
  const [history, setHistory] = useState([])
  const [selectedTheme, setSelectedTheme] = useState('dark-purple')
  const [activeTypes, setActiveTypes] = useState(['tip', 'feature', 'comparison'])
  const [overlayOpacity, setOverlayOpacity] = useState(55)
  const [loading, setLoading] = useState(false)
  const [toast, setToast] = useState('')
  const [showToast, setShowToast] = useState(false)
  const [modalOpen, setModalOpen] = useState(false)
  const [editHeadline, setEditHeadline] = useState('')
  const [editSub, setEditSub] = useState('')
  const [progress, setProgress] = useState(0)
  const [progressActive, setProgressActive] = useState(false)
  const [unsplashKey, setUnsplashKey] = useState('')
  const [aiProvider, setAiProvider] = useState('anthropic') // 'anthropic' or 'minimax'
  const [anthropicKey, setAnthropicKey] = useState('')
  const [anthropicBaseUrl, setAnthropicBaseUrl] = useState('https://api.anthropic.com')
  const [anthropicModel, setAnthropicModel] = useState('claude-sonnet-4-20250514')
  const [minimaxKey, setMinimaxKey] = useState('')
  const [minimaxBaseUrl, setMinimaxBaseUrl] = useState('https://api.minimax.chat/v1')
  const [minimaxModel, setMinimaxModel] = useState('MiniMax-Text-01')
  const [imageSource, setImageSource] = useState('unsplash') // 'unsplash' or 'pinterest'
  const [pinterestImages, setPinterestImages] = useState({})
  const [pinterestLoading, setPinterestLoading] = useState(false)
  const [testResult, setTestResult] = useState('')
  const [testLoading, setTestLoading] = useState(false)
  const [importingIndex, setImportingIndex] = useState(null)
  const fileInputRef = useRef(null)
  const slideRefs = useRef({})

  useEffect(() => {
    const savedHistory = localStorage.getItem('sf_history')
    if (savedHistory) {
      setHistory(JSON.parse(savedHistory))
    }
    
    // Load saved API settings
    const savedUnsplashKey = localStorage.getItem('sf_unsplashKey')
    const savedAnthropicKey = localStorage.getItem('sf_anthropicKey')
    const savedAnthropicBaseUrl = localStorage.getItem('sf_anthropicBaseUrl')
    const savedAnthropicModel = localStorage.getItem('sf_anthropicModel')
    const savedAiProvider = localStorage.getItem('sf_aiProvider')
    const savedMinimaxKey = localStorage.getItem('sf_minimaxKey')
    const savedMinimaxBaseUrl = localStorage.getItem('sf_minimaxBaseUrl')
    const savedMinimaxModel = localStorage.getItem('sf_minimaxModel')
    
    if (savedUnsplashKey) setUnsplashKey(savedUnsplashKey)
    if (savedAnthropicKey) setAnthropicKey(savedAnthropicKey)
    if (savedAnthropicBaseUrl) setAnthropicBaseUrl(savedAnthropicBaseUrl)
    if (savedAnthropicModel) setAnthropicModel(savedAnthropicModel)
    if (savedAiProvider) setAiProvider(savedAiProvider)
    if (savedMinimaxKey) setMinimaxKey(savedMinimaxKey)
    if (savedMinimaxBaseUrl) setMinimaxBaseUrl(savedMinimaxBaseUrl)
    if (savedMinimaxModel) setMinimaxModel(savedMinimaxModel)
  }, [])

  useEffect(() => {
    if (showToast) {
      const timer = setTimeout(() => setShowToast(false), 2500)
      return () => clearTimeout(timer)
    }
  }, [showToast])

  const showToastMsg = (msg) => {
    setToast(msg)
    setShowToast(true)
  }

  const testUnsplash = async () => {
    if (!unsplashKey) {
      setTestResult('⚠ Paste your key first')
      return
    }
    setTestLoading(true)
    setTestResult('')
    try {
      const res = await fetch(`https://api.unsplash.com/photos/random?query=calm&count=1`, {
        headers: { Authorization: `Client-ID ${unsplashKey}` }
      })
      const data = await res.json()
      if (data.errors) {
        setTestResult('✗ Key invalid: ' + data.errors[0])
      } else if (data.length) {
        setTestResult('✓ Key works! Photos will load on generate.')
      } else {
        throw new Error('no photos')
      }
    } catch(e) {
      setTestResult('✗ Key invalid or request failed.')
    }
    setTestLoading(false)
  }

  const fetchPhoto = async (keyword, accessKey) => {
    const queries = [keyword, 'calm lifestyle minimal', 'peaceful person']
    for (const q of queries) {
      try {
        const res = await fetch(`https://api.unsplash.com/photos/random?query=${encodeURIComponent(q)}&orientation=portrait&count=10`, {
          headers: { Authorization: `Client-ID ${accessKey}` }
        })
        if (res.ok) {
          const data = await res.json()
          if (!data.errors && data.length) {
            const photo = data[Math.floor(Math.random() * data.length)]
            return { url: photo.urls.regular, credit: photo.user.name, creditLink: photo.user.links.html }
          }
        }
      } catch (e) { console.warn('Photo fetch failed:', e) }
    }
    return null
  }

  // Fetch images from Pinterest API
  const fetchPinterestImages = async (keyword) => {
    try {
      const res = await fetch(`/api/images/pinterest?q=${encodeURIComponent(keyword)}`)
      const data = await res.json()
      if (data.success && data.images && data.images.length > 0) {
        return data.images
      }
    } catch (e) {
      console.warn('Pinterest fetch failed:', e)
    }
    return []
  }

  const getPhotoKeyword = (slide) => {
    const keywordMap = {
      hook: 'person overwhelmed phone anxiety',
      tip: 'calm focused person desk minimal',
      feature: 'smartphone productivity clean',
      comparison: 'before after calm stress relief',
      stat: 'focus clarity minimal workspace',
      myth: 'person thinking contemplating',
      cta: 'person happy phone calm'
    }
    return keywordMap[slide.type] || 'calm minimal lifestyle'
  }

  const generateSlides = async () => {
    const topic = document.getElementById('topicInput')?.value?.trim()
    const appName = document.getElementById('appName')?.value?.trim() || 'the app'
    const cta = document.getElementById('ctaText')?.value?.trim() || `Search ${appName}`
    const count = parseInt(document.getElementById('slideCount')?.value) || 5
    const tone = document.getElementById('toneSelect')?.value || 'relatable'

    if (!topic) { showToastMsg('Add a topic first!'); return; }
    if (aiProvider === 'anthropic' && !anthropicKey) { showToastMsg('Add your Anthropic API key first!'); return; }
    if (aiProvider === 'minimax' && !minimaxKey) { showToastMsg('Add your Minimax API key first!'); return; }

    setLoading(true)
    setProgressActive(true)
    let prog = 0
    const progInterval = setInterval(() => {
      prog = Math.min(prog + Math.random() * 15, 88)
      setProgress(prog)
    }, 300)

    const toneMap = {
      relatable: 'raw, honest, ADHD-first-person voice — like a TikTok creator speaking directly to their people',
      educational: 'clear, informative, slightly authoritative but approachable',
      hype: 'punchy, bold, uppercase energy — like a hype reel',
      soft: 'gentle, validating, understanding — speaks to ADHD struggles with empathy'
    }

    const typeInstructions = activeTypes.length
      ? `Mix these slide types across the value slides: ${activeTypes.join(', ')}.`
      : 'Use a mix of tips and feature highlights.'

    const prompt = `You are a TikTok content strategist for a mobile app called "${appName}" — an AI call assistant that makes and takes phone calls for you, designed for the ADHD community.

Generate a TikTok carousel with exactly ${count} slides based on this topic/angle: "${topic}"

Tone: ${toneMap[tone]}
${typeInstructions}

STRUCTURE (strictly follow this):
- Slide 1: HOOK — bold, scroll-stopping, speaks directly to ADHD pain around phone calls. No fluff.
- Slides 2 to ${count - 1}: VALUE slides — tips, features, before/after, or relatable moments. Each has a short punchy headline + 1 sentence of supporting text.
- Slide ${count}: SOFT CTA — subtle, not salesy. Something like "${cta}". Headline should feel like a natural ending, not an ad.

Return ONLY a JSON array. No markdown, no explanation. Format:
[
  { "type": "hook", "headline": "...", "sub": "..." },
  { "type": "tip"|"feature"|"comparison"|"stat"|"myth", "headline": "...", "sub": "..." },
  ...
  { "type": "cta", "headline": "...", "sub": "${cta}" }
]

Rules:
- Headlines: 4–10 words max, punchy
- Sub: 1 sentence, max 15 words
- ADHD-specific language: executive dysfunction, phone anxiety, paralysis, dopamine, overwhelm — use naturally, not forced
- The app is never the main character — the ADHD person is. The app is just the solution hinted at.
- CTA slide sub must be exactly: "${cta}"`

    try {
      let res, data, raw, clean, slides
      
      if (aiProvider === 'minimax') {
        // Minimax API call
        const minimaxPrompt = `${prompt}\n\nIMPORTANT: Return ONLY a valid JSON array, no markdown formatting, no explanations.`
        
        res = await fetch(`${minimaxBaseUrl}/text/chatcompletion_v2?GroupId=${minimaxKey.split(':')[0]}`, {
          method: 'POST',
          headers: { 
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${minimaxKey}`
          },
          body: JSON.stringify({
            model: minimaxModel,
            messages: [{ role: 'user', content: minimaxPrompt }]
          })
        })
        
        data = await res.json()
        // Minimax returns different response format
        raw = data.choices?.[0]?.message?.content || ''
        clean = raw.replace(/```json|```/g, '').trim()
        slides = JSON.parse(clean)
      } else {
        // Anthropic API call
        res = await fetch(`${anthropicBaseUrl}/v1/messages`, {
          method: 'POST',
          headers: { 
            'Content-Type': 'application/json',
            'x-api-key': anthropicKey
          },
          body: JSON.stringify({
            model: anthropicModel,
            max_tokens: 1000,
            messages: [{ role: 'user', content: prompt }]
          })
        })

        data = await res.json()
        raw = data.content.map(b => b.text || '').join('')
        clean = raw.replace(/```json|```/g, '').trim()
        slides = JSON.parse(clean)
      }

      clearInterval(progInterval)
      setProgress(100)
      setTimeout(() => setProgressActive(false), 600)

      setCurrentSlides(slides)
      
      // Fetch photos based on selected source
      if (imageSource === 'unsplash' && unsplashKey) {
        slides.forEach((slide, i) => { slide.photo = null; slide.photoCredit = null; slide.photoCreditLink = null; })
        setCurrentSlides([...slides])
        await Promise.all(slides.map(async (slide, i) => {
          const photo = await fetchPhoto(getPhotoKeyword(slide), unsplashKey)
          if (photo) {
            slides[i].photo = photo.url
            slides[i].photoCredit = photo.credit
            slides[i].photoCreditLink = photo.creditLink
          }
          setCurrentSlides([...slides])
        }))
      } else if (imageSource === 'pinterest') {
        // Fetch images from Pinterest
        setPinterestLoading(true)
        showToastMsg('Fetching Pinterest images...')
        
        // Get unique keywords for each slide type
        const keywords = slides.map(slide => getPhotoKeyword(slide))
        const uniqueKeywords = [...new Set(keywords)]
        
        // Fetch images for each unique keyword
        const pinterestCache = {}
        for (const keyword of uniqueKeywords) {
          const images = await fetchPinterestImages(keyword)
          if (images.length > 0) {
            pinterestCache[keyword] = images
          }
        }
        
        setPinterestImages(pinterestCache)
        setPinterestLoading(false)
        
        // Assign images to slides
        slides.forEach((slide, i) => { 
          slide.photo = null; 
          slide.photoCredit = 'Pinterest'; 
          slide.photoCreditLink = 'https://pinterest.com';
        })
        setCurrentSlides([...slides])
        
        // Assign random Pinterest images to each slide
        await Promise.all(slides.map(async (slide, i) => {
          const keyword = getPhotoKeyword(slide)
          const images = pinterestCache[keyword]
          if (images && images.length > 0) {
            const randomImage = images[Math.floor(Math.random() * images.length)]
            slides[i].photo = randomImage
          }
          setCurrentSlides([...slides])
        }))
        
        if (slides.some(s => s.photo)) {
          showToastMsg('Pinterest images loaded! 🎨')
        } else {
          showToastMsg('No Pinterest images found. Try different keywords.')
        }
      }
      saveToHistory(topic, slides)

    } catch (e) {
      clearInterval(progInterval)
      setProgressActive(false)
      showToastMsg('Something went wrong. Try again.')
      console.error(e)
    }

    setLoading(false)
  }

  const saveToHistory = (topic, slides) => {
    const newHistory = [{ topic, slides, theme: selectedTheme, date: Date.now() }, ...history].slice(0, 5)
    setHistory(newHistory)
    localStorage.setItem('sf_history', JSON.stringify(newHistory))
  }

  const timeAgo = (ts) => {
    const s = Math.floor((Date.now() - ts) / 1000)
    if (s < 60) return 'just now'
    if (s < 3600) return Math.floor(s/60) + 'm ago'
    if (s < 86400) return Math.floor(s/3600) + 'h ago'
    return Math.floor(s/86400) + 'd ago'
  }

  const exportSlides = () => {
    const text = currentSlides.map((s, i) =>
      `SLIDE ${i+1} [${s.type.toUpperCase()}]\n${s.headline}\n${s.sub || ''}`
    ).join('\n\n---\n\n')
    navigator.clipboard.writeText(text).then(() => showToastMsg('Copied to clipboard! 🎉'))
  }

  const openEdit = (i) => {
    setEditingIndex(i)
    setEditHeadline(currentSlides[i].headline)
    setEditSub(currentSlides[i].sub || '')
    setModalOpen(true)
  }

  const closeModal = () => {
    setModalOpen(false)
    setEditingIndex(null)
  }

  const saveEdit = () => {
    if (editingIndex === null) return
    const newSlides = [...currentSlides]
    newSlides[editingIndex].headline = editHeadline
    newSlides[editingIndex].sub = editSub
    setCurrentSlides(newSlides)
    closeModal()
    showToastMsg('Slide updated!')
  }

  const getFontSize = (text) => {
    const len = text.length
    if (len < 30) return '26px'
    if (len < 50) return '22px'
    return '18px'
  }

  const handleImportClick = (index) => {
    setImportingIndex(index)
    fileInputRef.current?.click()
  }

  const handleImageImport = (e) => {
    const file = e.target.files?.[0]
    if (!file || importingIndex === null) return
    
    const reader = new FileReader()
    reader.onload = (event) => {
      const newSlides = [...currentSlides]
      newSlides[importingIndex].photo = event.target?.result
      newSlides[importingIndex].photoCredit = null
      newSlides[importingIndex].photoCreditLink = null
      setCurrentSlides(newSlides)
      setImportingIndex(null)
    }
    reader.readAsDataURL(file)
    e.target.value = ''
  }

  const removeImage = (e, index) => {
    e.stopPropagation()
    const newSlides = [...currentSlides]
    newSlides[index].photo = null
    newSlides[index].photoCredit = null
    newSlides[index].photoCreditLink = null
    setCurrentSlides(newSlides)
  }

  const exportSlidesAsImages = async () => {
    if (currentSlides.length === 0) return
    
    showToastMsg('Generating images...')
    const zip = new JSZip()
    const folder = zip.folder('slides')
    
    for (let i = 0; i < currentSlides.length; i++) {
      const slideEl = slideRefs.current[i]
      if (slideEl) {
        try {
          const canvas = await html2canvas(slideEl, {
            scale: 2,
            useCORS: true,
            backgroundColor: null,
            logging: false
          })
          const dataUrl = canvas.toDataURL('image/png')
          const base64 = dataUrl.split(',')[1]
          folder.file(`slide-${i + 1}.png`, base64, { base64: true })
        } catch (err) {
          console.error('Failed to export slide', i, err)
        }
      }
    }
    
    const content = await zip.generateAsync({ type: 'blob' })
    const url = URL.createObjectURL(content)
    const a = document.createElement('a')
    a.href = url
    a.download = 'tiktok-carousel.zip'
    a.click()
    URL.revokeObjectURL(url)
    showToastMsg('Downloaded carousel!')
  }

  const theme = THEMES[selectedTheme]
  const overlayColor = selectedTheme === 'clean-white'
    ? `rgba(255,255,255,${overlayOpacity / 100})`
    : `rgba(0,0,0,${overlayOpacity / 100})`

  const badgeLabels = { hook: '🔥 Hook', tip: '💡 Tip', feature: '⚡ Feature', comparison: '↔ Before/After', stat: '📊 Stat', myth: '❌ Myth', cta: '👋 CTA' }

  return (
    <>
      <header>
        <div className="logo-dot"></div>
        <h1>SlideForge</h1>
        <span>TikTok Carousel Generator</span>
      </header>

      <div className="app">
        <div className="panel">
          <div className="panel-section">
            <label>Topic / Hook Angle</label>
            <textarea id="topicInput" placeholder="e.g. Phone anxiety is stopping you from being productive — here's how ADHD brains can finally take back control of calls..."></textarea>
          </div>

          <div className="panel-section">
            <label>App Name</label>
            <input type="text" id="appName" defaultValue="RingPilot" placeholder="Your app name" />
          </div>

          <div className="panel-section">
            <label>Soft CTA</label>
            <input type="text" id="ctaText" defaultValue="Search RingPilot 👀" placeholder="e.g. Search [app] in the App Store" />
          </div>

          <div className="row">
            <div className="panel-section">
              <label>No. of Slides</label>
              <select id="slideCount">
                <option value="4">4 slides</option>
                <option value="5" selected>5 slides</option>
                <option value="6">6 slides</option>
                <option value="7">7 slides</option>
              </select>
            </div>
            <div className="panel-section">
              <label>Tone</label>
              <select id="toneSelect">
                <option value="relatable">Relatable / Raw</option>
                <option value="educational">Educational</option>
                <option value="hype">Hype / Bold</option>
                <option value="soft">Soft / Gentle</option>
              </select>
            </div>
          </div>

          <div className="panel-section">
            <label>Slide Types</label>
            <div className="type-grid">
              {['tip', 'feature', 'comparison', 'stat', 'myth'].map(type => (
                <div
                  key={type}
                  className={`type-tag ${activeTypes.includes(type) ? 'active' : ''}`}
                  onClick={() => {
                    const newTypes = activeTypes.includes(type)
                      ? activeTypes.filter(t => t !== type)
                      : [...activeTypes, type]
                    setActiveTypes(newTypes)
                  }}
                >
                  {type === 'tip' && '💡 Tips'}
                  {type === 'feature' && '⚡ Features'}
                  {type === 'comparison' && '↔️ Before/After'}
                  {type === 'stat' && '📊 Stats'}
                  {type === 'myth' && '❌ Myth Bust'}
                </div>
              ))}
            </div>
          </div>

          <div className="panel-section">
            <label>Color Theme</label>
            <div className="themes">
              {Object.entries({
                'dark-purple': { background: 'linear-gradient(135deg,#1a0533,#7c5cfc)' },
                'neon-dark': { background: 'linear-gradient(135deg,#000,#00ff88)' },
                'sunset': { background: 'linear-gradient(135deg,#1a0a00,#ff5f00)' },
                'pink-dark': { background: 'linear-gradient(135deg,#1a0015,#fc5c7d)' },
                'ocean': { background: 'linear-gradient(135deg,#001233,#0077ff)' },
                'clean-white': { background: 'linear-gradient(135deg,#f0f0f0,#fff)', border: '1px solid #ddd' }
              }).map(([key, style]) => (
                <div
                  key={key}
                  className={`theme-btn ${selectedTheme === key ? 'active' : ''}`}
                  data-theme={key}
                  style={style}
                  title={key.replace('-', ' ')}
                  onClick={() => {
                    setSelectedTheme(key)
                    if (currentSlides.length) setCurrentSlides([...currentSlides])
                  }}
                ></div>
              ))}
            </div>
          </div>

          <div className="panel-section">
            <label>Image Source</label>
            <div style={{display:'flex',gap:'8px',alignItems:'center'}}>
              <div style={{display:'flex',background:'var(--surface2)',borderRadius:'10px',padding:'4px',gap:'4px',flex:1}}>
                <button
                  onClick={() => setImageSource('unsplash')}
                  style={{
                    flex:1,
                    padding:'10px 8px',
                    background: imageSource === 'unsplash' ? 'var(--accent)' : 'transparent',
                    border:'none',
                    borderRadius:'8px',
                    color: imageSource === 'unsplash' ? '#000' : 'var(--text)',
                    fontSize:'12px',
                    cursor:'pointer',
                    fontWeight: imageSource === 'unsplash' ? '600' : '400',
                    transition:'all 0.2s'
                  }}
                >
                  📷 Unsplash
                </button>
                <button
                  onClick={() => setImageSource('pinterest')}
                  style={{
                    flex:1,
                    padding:'10px 8px',
                    background: imageSource === 'pinterest' ? 'var(--accent)' : 'transparent',
                    border:'none',
                    borderRadius:'8px',
                    color: imageSource === 'pinterest' ? '#000' : 'var(--text)',
                    fontSize:'12px',
                    cursor:'pointer',
                    fontWeight: imageSource === 'pinterest' ? '600' : '400',
                    transition:'all 0.2s'
                  }}
                >
                  🎨 Pinterest
                </button>
              </div>
            </div>
            {imageSource === 'pinterest' && (
              <div style={{fontSize:'10px',color:'var(--muted)',marginTop:'6px'}}>
                Uses browser automation to search Pinterest
              </div>
            )}
          </div>

          {/* AI Provider Selector */}
          <div className="panel-section">
            <label>AI Provider</label>
            <select 
              value={aiProvider}
              onChange={(e) => {
                setAiProvider(e.target.value)
                localStorage.setItem('sf_aiProvider', e.target.value)
              }}
              style={{
                width: '100%',
                padding: '10px 12px',
                fontSize: '12px',
                background: 'var(--surface2)',
                border: '1px solid var(--border)',
                borderRadius: '10px',
                color: 'var(--text)',
                outline: 'none'
              }}
            >
              <option value="anthropic">Anthropic (Claude)</option>
              <option value="minimax">Minimax</option>
            </select>
          </div>

          {/* Anthropic API Settings */}
          <div className="panel-section" style={{opacity: aiProvider === 'anthropic' ? 1 : 0.4}}>
            <label>Anthropic Model</label>
            <select 
              value={anthropicModel}
              onChange={(e) => {
                setAnthropicModel(e.target.value)
                localStorage.setItem('sf_anthropicModel', e.target.value)
              }}
              style={{
                width: '100%',
                padding: '10px 12px',
                fontSize: '12px',
                background: 'var(--surface2)',
                border: '1px solid var(--border)',
                borderRadius: '10px',
                color: 'var(--text)',
                outline: 'none'
              }}
            >
              <option value="claude-sonnet-4-20250514">Claude Sonnet 4 (Recommended)</option>
              <option value="claude-4-opus-20250514">Claude Opus 4 (Best Quality)</option>
              <option value="claude-4-haiku-20250514">Claude Haiku 4 (Fastest)</option>
              <option value="claude-3-opus-20240229">Claude 3 Opus</option>
              <option value="claude-3-sonnet-20240229">Claude 3 Sonnet</option>
              <option value="claude-3-haiku-20240307">Claude 3 Haiku</option>
            </select>
          </div>

          <div className="panel-section">
            <label>Anthropic API Base URL</label>
            <input 
              type="text" 
              placeholder="https://api.anthropic.com" 
              style={{fontSize:'12px'}}
              value={anthropicBaseUrl}
              onChange={(e) => {
                setAnthropicBaseUrl(e.target.value)
                localStorage.setItem('sf_anthropicBaseUrl', e.target.value)
              }}
            />
            <div style={{fontSize:'10px',color:'var(--muted)',marginTop:'4px'}}>
              Default: https://api.anthropic.com
            </div>
          </div>

          <div className="panel-section">
            <label>Anthropic API Key <a href="https://console.anthropic.com/" target="_blank" style={{color:'var(--accent)',fontSize:'10px',textDecoration:'none',marginLeft:'4px'}}>get key →</a></label>
            <input 
              type="password" 
              placeholder="sk-ant-..." 
              style={{fontSize:'12px'}}
              value={anthropicKey}
              onChange={(e) => {
                setAnthropicKey(e.target.value)
                localStorage.setItem('sf_anthropicKey', e.target.value)
              }}
              disabled={aiProvider !== 'anthropic'}
            />
          </div>

          {/* Minimax API Settings */}
          <div className="panel-section" style={{opacity: aiProvider === 'minimax' ? 1 : 0.4}}>
            <label>Minimax Model</label>
            <select 
              value={minimaxModel}
              onChange={(e) => {
                setMinimaxModel(e.target.value)
                localStorage.setItem('sf_minimaxModel', e.target.value)
              }}
              style={{
                width: '100%',
                padding: '10px 12px',
                fontSize: '12px',
                background: 'var(--surface2)',
                border: '1px solid var(--border)',
                borderRadius: '10px',
                color: 'var(--text)',
                outline: 'none'
              }}
              disabled={aiProvider !== 'minimax'}
            >
              <option value="MiniMax-Text-01">MiniMax Text 01 (Recommended)</option>
              <option value="abab6.5s-chat">ABAB 6.5S Chat</option>
              <option value="abab6-chat">ABAB 6 Chat</option>
            </select>
          </div>

          <div className="panel-section" style={{opacity: aiProvider === 'minimax' ? 1 : 0.4}}>
            <label>Minimax API Base URL</label>
            <input 
              type="text" 
              placeholder="https://api.minimax.chat/v1" 
              style={{fontSize:'12px'}}
              value={minimaxBaseUrl}
              onChange={(e) => {
                setMinimaxBaseUrl(e.target.value)
                localStorage.setItem('sf_minimaxBaseUrl', e.target.value)
              }}
              disabled={aiProvider !== 'minimax'}
            />
            <div style={{fontSize:'10px',color:'var(--muted)',marginTop:'4px'}}>
              Default: https://api.minimax.chat/v1
            </div>
          </div>

          <div className="panel-section" style={{opacity: aiProvider === 'minimax' ? 1 : 0.4}}>
            <label>Minimax API Key <a href="https://platform.minimax.io/" target="_blank" style={{color:'var(--accent)',fontSize:'10px',textDecoration:'none',marginLeft:'4px'}}>get key →</a></label>
            <input 
              type="password" 
              placeholder="API Key (e.g., your_key:your_group_id)" 
              style={{fontSize:'12px'}}
              value={minimaxKey}
              onChange={(e) => {
                setMinimaxKey(e.target.value)
                localStorage.setItem('sf_minimaxKey', e.target.value)
              }}
              disabled={aiProvider !== 'minimax'}
            />
            <div style={{fontSize:'10px',color:'var(--muted)',marginTop:'4px'}}>
              Format: your_api_key:group_id
            </div>
          </div>

          <div className="panel-section" style={{opacity: imageSource === 'unsplash' ? 1 : 0.5}}>
            <label>Unsplash API Key <a href="https://unsplash.com/developers" target="_blank" style={{color:'var(--accent)',fontSize:'10px',textDecoration:'none',marginLeft:'4px'}}>get free key →</a></label>
            <div style={{display:'flex',gap:'8px',alignItems:'center'}}>
              <input 
                type="text" 
                id="unsplashKey" 
                placeholder="Paste your Unsplash Access Key" 
                style={{fontSize:'12px',flex:1}}
                value={unsplashKey}
                onChange={(e) => {
                  setUnsplashKey(e.target.value)
                  localStorage.setItem('sf_unsplashKey', e.target.value)
                }}
              />
              <button 
                onClick={testUnsplash} 
                style={{padding:'10px 12px',background:'var(--surface2)',border:'1px solid var(--border)',borderRadius:'10px',color:'var(--text)',fontSize:'12px',cursor:'pointer',whiteSpace:'nowrap'}}
                disabled={testLoading}
              >
                {testLoading ? '...' : 'Test'}
              </button>
            </div>
            {testResult && (
              <div style={{
                fontSize:'11px',
                marginTop:'6px',
                display: testResult ? 'block' : 'none',
                color: testResult.includes('✓') ? '#5cfca0' : '#fc5c7d'
              }}>
                {testResult}
              </div>
            )}
          </div>

          <div className="panel-section">
            <label>Photo Overlay Darkness</label>
            <div style={{display:'flex',alignItems:'center',gap:'10px'}}>
              <input 
                type="range" 
                id="overlayOpacity" 
                min="30" 
                max="85" 
                value={overlayOpacity}
                onChange={(e) => {
                  setOverlayOpacity(parseInt(e.target.value))
                  if (currentSlides.length) setCurrentSlides([...currentSlides])
                }}
                style={{flex:1,padding:0,background:'transparent',border:'none',accentColor:'var(--accent)'}} 
              />
              <span style={{fontSize:'12px',color:'var(--muted)',width:'30px'}}>{overlayOpacity}%</span>
            </div>
          </div>

          <button className={`gen-btn ${loading ? 'loading' : ''}`} onClick={generateSlides} disabled={loading}>
            <div className="spinner"></div>
            <span className="btn-text">✦ Generate Carousel</span>
          </button>

          <div className={`progress-bar ${progressActive ? 'active' : ''}`}>
            <div className="progress-fill" style={{width: `${progress}%`}}></div>
          </div>

          {history.length > 0 && (
            <div className="history-section">
              <h3>RECENT BATCHES</h3>
              {history.map((item, i) => (
                <div 
                  key={i} 
                  className="history-item"
                  onClick={() => {
                    setCurrentSlides(item.slides)
                    setSelectedTheme(item.theme || selectedTheme)
                  }}
                >
                  <div className="hi-topic">{item.topic}</div>
                  <div className="hi-meta">{item.slides.length} slides · {timeAgo(item.date)}</div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="canvas-area" id="canvasArea">
          {currentSlides.length === 0 ? (
            <div className="empty-state">
              <div className="big">✦</div>
              <p>Fill in your topic and hit Generate</p>
              <p style={{fontSize:'12px', marginTop:'4px', color:'#555'}}>AI writes the slides, you export & post</p>
            </div>
          ) : (
            <div className="slides-section">
              <div className="slides-header">
                <h2>{currentSlides.length} Slides Ready ✦</h2>
                <div style={{display:'flex', gap:'8px'}}>
                  <button className="export-btn" onClick={exportSlides}>⬇ Copy Text</button>
                  <button className="export-btn" style={{background:'var(--accent)'}} onClick={exportSlidesAsImages}>⬇ Download Images</button>
                </div>
              </div>
              <div className="slides-scroll">
                {currentSlides.map((slide, i) => (
                  <div key={i} className="slide-wrap">
                    <div className="slide-num">Slide {i + 1} of {currentSlides.length}</div>
                    <div 
                      ref={el => slideRefs.current[i] = el}
                      className={`slide slide-type-${slide.type}`}
                      style={!slide.photo ? { background: theme.bg } : {}}
                      onClick={() => openEdit(i)}
                    >
                      {slide.photo && (
                        <>
                          <img className="slide-photo" src={slide.photo} loading="lazy" alt="" />
                          <div className="slide-photo-overlay" style={{background: overlayColor}}></div>
                        </>
                      )}
                      {!slide.photo && (unsplashKey || imageSource === 'pinterest') && (
                        <div className="photo-loading">
                          {pinterestLoading ? 'loading Pinterest images...' : 'loading photo...'}
                        </div>
                      )}
                      <div className="slide-inner">
                        <div className="slide-badge" style={{background: theme.badge_bg, color: theme.accent}}>
                          {badgeLabels[slide.type] || slide.type}
                        </div>
                        <div className="slide-headline" style={{color: theme.text, fontSize: getFontSize(slide.headline)}}>
                          {slide.headline}
                        </div>
                        {slide.sub && <div className="slide-sub" style={{color: theme.sub}}>{slide.sub}</div>}
                        {slide.type === 'cta' && (
                          <div className="slide-cta-text" style={{color: theme.accent, marginTop:'auto', paddingTop:'16px'}}>
                            → {slide.sub}
                          </div>
                        )}
                        <div className="slide-number-pill" style={{background: theme.num, color: theme.text}}>{i+1}</div>
                      </div>
                      {slide.photoCredit && (
                        <a className="photo-credit" href={slide.photoCreditLink} target="_blank" rel="noopener noreferrer">
                          📷 {slide.photoCredit} {slide.photoCreditLink === 'https://pinterest.com' ? '/ Pinterest' : '/ Unsplash'}
                        </a>
                      )}
                      {slide.photo && !slide.photoCredit && (
                        <div 
                          className="photo-remove" 
                          onClick={(e) => removeImage(e, i)}
                          style={{
                            position:'absolute', top:'8px', right:'8px', 
                            background:'rgba(0,0,0,0.6)', border:'none', 
                            borderRadius:'50%', width:'24px', height:'24px',
                            color:'white', cursor:'pointer', fontSize:'12px',
                            display:'flex', alignItems:'center', justifyContent:'center',
                            zIndex:20
                          }}
                        >✕</div>
                      )}
                      <div className="slide-import-overlay" onClick={(e) => { e.stopPropagation(); handleImportClick(i); }}>
                        <div style={{fontSize:'20px'}}>📷</div>
                        <div className="edit-hint">{slide.photo ? 'Change photo' : 'Add photo'}</div>
                      </div>
                      <div className="slide-edit-overlay" onClick={(e) => { e.stopPropagation(); openEdit(i); }}>
                        <div style={{fontSize:'20px'}}>✏️</div>
                        <div className="edit-hint">Edit text</div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        style={{ display: 'none' }}
        onChange={handleImageImport}
      />

      <div className={`modal-bg ${modalOpen ? 'open' : ''}`} onClick={(e) => e.target.classList.contains('modal-bg') && closeModal()}>
        <div className="modal">
          <h3>Edit Slide</h3>
          <div className="panel-section">
            <label>Headline</label>
            <textarea 
              id="editHeadline" 
              rows="3" 
              value={editHeadline}
              onChange={(e) => setEditHeadline(e.target.value)}
            />
          </div>
          <div className="panel-section">
            <label>Subtext (optional)</label>
            <textarea 
              id="editSub" 
              rows="2" 
              value={editSub}
              onChange={(e) => setEditSub(e.target.value)}
            />
          </div>
          <div className="modal-actions">
            <button className="modal-cancel" onClick={closeModal}>Cancel</button>
            <button className="modal-save" onClick={saveEdit}>Save</button>
          </div>
        </div>
      </div>

      <div className={`toast ${showToast ? 'show' : ''}`}>{toast}</div>
    </>
  )
}
