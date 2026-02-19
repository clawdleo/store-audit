import { useState, useEffect, useRef } from 'react'
import './App.css'

const CHECKLIST_DATA = {
  "TRGOVINA": [
    "Gasilni aparati in hidranti dostopni",
    "Trgovina zasilni izhodi označeni, dostopni",
    "Trgovina evakuacijski načrt",
    "Zaposleni z izpitom za platformo v različnih izmenah",
    "Imajo vsi zaposleni čevlje (morajo imeti obute)",
    "Vocovo zaposleni CSS (ali so vsi zaposleni notri, imajo slike, stari zaposleni izbrisani, oznaka nad tablico po konceptu)"
  ],
  "SKLADIŠČE": [
    "Lestve izpravne (gume v dobrem stanju, špage pritrjene)",
    "Platforma izpravna?",
    "Čisto in urejeno in vse izza rumenih črt",
    "Gasilni aparati in hidranti so dostopni",
    "Sprinklerji dostopni, brez paketov izpod njih - vsaj 1m",
    "Luči v skladišču imajo vsaj 1m do prve škatle",
    "Koncept skladišča (preveriti oznake po oddelkih v skladišču)",
    "Elektro omarica lepo dostopna da se da odpreti na 90 stopinj",
    "Tabla za vašo varnost posodobljena",
    "Orodje v dobrem stanju (vozički, paletniki itd..)"
  ],
  "WC IN SKUPNI PROSTORI": [
    "Čisto in urejeno",
    "Plakati v skupnih prostorih postavljeni po konceptu (točno po sliki - preveriti okvirje)",
    "Poster interna organizacija je pravilna (po konceptu)",
    "Preveriti prvo pomoč (da ni potekel rok)"
  ],
  "ZAPOSLENI": [
    "Ali imajo vsi zaposleni PI in PLI?",
    "MYPIPELINE (preveriti barve, area responsible enako kot na IO plakatu, Vodje izmen - ključi, enako kot na IO plakatu)",
    "Zaposleni (uniforma, čevlji, nametag po konceptu)",
    "Zaposleni (nasmejani, customer first orientirani)",
    "Intro programi + tečaji vseh zaposlenih posebaj pa novih"
  ],
  "MED OBISKOM PAZITI NA": [
    "Atmosfera v trgovini... nasmeh, iskrice v očeh itd.",
    "Delo s strankami... pristopanje vsaki stranki",
    "Kako sodeluje interna org. v trgovinah in katere sestanke opravljamo",
    "Pregled pipeline - kaj delamo z rdečimi, kaj z zelenimi in potenciali... ali imamo talente, SMT načrt, kaj delamo s trenutnimi potenciali itd..",
    "Status MYDEVELOPMENT - ali smo vse opravili, ali imamo izplanirano v kolikor še nismo?"
  ],
  "VIDEZ TRGOVINE": [
    "Čisto in urejeno",
    "Dobro založeno",
    "Cene/IDG na 100%",
    "Blagajna in vhod - čisto in urejeno",
    "Vsi morajo imeti oznako z imenom in natisnjeno ime (vsi v istem formatu, vidite koncept, da smo tu na 100%)"
  ]
}

function App() {
  const [storeName, setStoreName] = useState('')
  const [auditorName, setAuditorName] = useState('')
  const [checklistState, setChecklistState] = useState({})
  const [photos, setPhotos] = useState({})
  const [notes, setNotes] = useState({})
  const [activeSection, setActiveSection] = useState(null)
  const [showExport, setShowExport] = useState(false)
  const [started, setStarted] = useState(false)
  const fileInputRef = useRef(null)
  const [currentPhotoItem, setCurrentPhotoItem] = useState(null)

  // Initialize checklist state
  useEffect(() => {
    const initial = {}
    Object.entries(CHECKLIST_DATA).forEach(([section, items]) => {
      items.forEach((item, idx) => {
        const key = `${section}-${idx}`
        initial[key] = null // null = not checked, true = OK, false = Issue
      })
    })
    setChecklistState(initial)
  }, [])

  const handleCheck = (key, value) => {
    setChecklistState(prev => ({ ...prev, [key]: value }))
  }

  const handlePhotoCapture = (key) => {
    setCurrentPhotoItem(key)
    fileInputRef.current?.click()
  }

  const handleFileChange = (e) => {
    const file = e.target.files?.[0]
    if (file && currentPhotoItem) {
      const reader = new FileReader()
      reader.onloadend = () => {
        setPhotos(prev => ({
          ...prev,
          [currentPhotoItem]: [...(prev[currentPhotoItem] || []), reader.result]
        }))
      }
      reader.readAsDataURL(file)
    }
    e.target.value = ''
  }

  const removePhoto = (key, index) => {
    setPhotos(prev => ({
      ...prev,
      [key]: prev[key].filter((_, i) => i !== index)
    }))
  }

  const handleNoteChange = (key, value) => {
    setNotes(prev => ({ ...prev, [key]: value }))
  }

  const getProgress = () => {
    const total = Object.keys(checklistState).length
    const checked = Object.values(checklistState).filter(v => v !== null).length
    return { total, checked, percent: Math.round((checked / total) * 100) }
  }

  const getSectionProgress = (section) => {
    const items = CHECKLIST_DATA[section]
    const total = items.length
    const checked = items.filter((_, idx) => checklistState[`${section}-${idx}`] !== null).length
    return { total, checked }
  }

  const exportReport = async () => {
    const date = new Date().toLocaleString('sl-SI')
    let html = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="UTF-8">
        <title>Audit Report - ${storeName}</title>
        <style>
          body { font-family: -apple-system, sans-serif; padding: 20px; max-width: 800px; margin: 0 auto; }
          h1 { color: #1a1a2e; border-bottom: 3px solid #C41E3A; padding-bottom: 10px; }
          h2 { color: #C41E3A; margin-top: 30px; }
          .meta { background: #f5f5f5; padding: 15px; border-radius: 8px; margin-bottom: 20px; }
          .item { padding: 12px; border-bottom: 1px solid #eee; }
          .item.ok { background: #e8f5e9; }
          .item.issue { background: #ffebee; }
          .item.unchecked { background: #fff3e0; }
          .status { font-weight: bold; margin-right: 10px; }
          .status.ok { color: #2e7d32; }
          .status.issue { color: #c62828; }
          .status.unchecked { color: #ef6c00; }
          .note { font-style: italic; color: #666; margin-top: 5px; }
          .photos { display: flex; gap: 10px; flex-wrap: wrap; margin-top: 10px; }
          .photos img { width: 150px; height: 150px; object-fit: cover; border-radius: 8px; }
          .summary { background: #1a1a2e; color: white; padding: 20px; border-radius: 8px; margin-top: 30px; }
          .summary h3 { margin-top: 0; }
          .stat { display: inline-block; margin-right: 30px; }
          .stat-val { font-size: 24px; font-weight: bold; }
        </style>
      </head>
      <body>
        <h1>Poročilo Pregleda Trgovine</h1>
        <div class="meta">
          <strong>Trgovina:</strong> ${storeName || 'Ni navedeno'}<br>
          <strong>Pregledal:</strong> ${auditorName || 'Ni navedeno'}<br>
          <strong>Datum:</strong> ${date}
        </div>
    `

    let totalOk = 0, totalIssue = 0, totalUnchecked = 0

    Object.entries(CHECKLIST_DATA).forEach(([section, items]) => {
      html += `<h2>${section}</h2>`
      items.forEach((item, idx) => {
        const key = `${section}-${idx}`
        const status = checklistState[key]
        const note = notes[key]
        const itemPhotos = photos[key] || []
        
        let statusClass = 'unchecked'
        let statusText = '⚪ Ni preverjeno'
        if (status === true) { statusClass = 'ok'; statusText = '✅ V redu'; totalOk++ }
        else if (status === false) { statusClass = 'issue'; statusText = '❌ Težava'; totalIssue++ }
        else { totalUnchecked++ }

        html += `
          <div class="item ${statusClass}">
            <span class="status ${statusClass}">${statusText}</span>
            ${item}
            ${note ? `<div class="note">Opomba: ${note}</div>` : ''}
            ${itemPhotos.length > 0 ? `
              <div class="photos">
                ${itemPhotos.map(p => `<img src="${p}" alt="Photo">`).join('')}
              </div>
            ` : ''}
          </div>
        `
      })
    })

    html += `
        <div class="summary">
          <h3>Povzetek</h3>
          <div class="stat"><div class="stat-val">${totalOk}</div>V redu</div>
          <div class="stat"><div class="stat-val">${totalIssue}</div>Težave</div>
          <div class="stat"><div class="stat-val">${totalUnchecked}</div>Ni preverjeno</div>
        </div>
      </body>
      </html>
    `

    // Create blob and download
    const blob = new Blob([html], { type: 'text/html' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `audit-${storeName || 'report'}-${new Date().toISOString().split('T')[0]}.html`
    a.click()
    URL.revokeObjectURL(url)
  }

  if (!started) {
    return (
      <div className="app">
        <div className="start-screen">
          <div className="logo">📋</div>
          <h1>Pregled Trgovine</h1>
          <p>Checklist za pregled skladnosti trgovine</p>
          <div className="form-group">
            <label>Ime trgovine</label>
            <input 
              type="text" 
              value={storeName} 
              onChange={e => setStoreName(e.target.value)}
              placeholder="npr. Ljubljana Center"
            />
          </div>
          <div className="form-group">
            <label>Ime pregledovalca</label>
            <input 
              type="text" 
              value={auditorName} 
              onChange={e => setAuditorName(e.target.value)}
              placeholder="Vaše ime"
            />
          </div>
          <button className="btn-primary" onClick={() => setStarted(true)}>
            Začni pregled
          </button>
        </div>
      </div>
    )
  }

  const progress = getProgress()

  return (
    <div className="app">
      <header>
        <div className="header-content">
          <h1>📋 {storeName || 'Pregled'}</h1>
          <div className="progress-bar">
            <div className="progress-fill" style={{ width: `${progress.percent}%` }} />
          </div>
          <span className="progress-text">{progress.checked}/{progress.total} ({progress.percent}%)</span>
        </div>
      </header>

      <main>
        {Object.entries(CHECKLIST_DATA).map(([section, items]) => {
          const sectionProgress = getSectionProgress(section)
          const isActive = activeSection === section
          
          return (
            <div key={section} className="section">
              <div 
                className={`section-header ${isActive ? 'active' : ''}`}
                onClick={() => setActiveSection(isActive ? null : section)}
              >
                <div className="section-info">
                  <h2>{section}</h2>
                  <span className="section-progress">
                    {sectionProgress.checked}/{sectionProgress.total}
                  </span>
                </div>
                <span className="chevron">{isActive ? '▲' : '▼'}</span>
              </div>
              
              {isActive && (
                <div className="section-items">
                  {items.map((item, idx) => {
                    const key = `${section}-${idx}`
                    const status = checklistState[key]
                    const itemPhotos = photos[key] || []
                    const note = notes[key] || ''
                    
                    return (
                      <div key={key} className={`item ${status === true ? 'ok' : status === false ? 'issue' : ''}`}>
                        <div className="item-text">{item}</div>
                        
                        <div className="item-actions">
                          <button 
                            className={`btn-check ok ${status === true ? 'active' : ''}`}
                            onClick={() => handleCheck(key, true)}
                          >
                            ✓
                          </button>
                          <button 
                            className={`btn-check issue ${status === false ? 'active' : ''}`}
                            onClick={() => handleCheck(key, false)}
                          >
                            ✗
                          </button>
                          <button 
                            className="btn-photo"
                            onClick={() => handlePhotoCapture(key)}
                          >
                            📷 {itemPhotos.length > 0 && `(${itemPhotos.length})`}
                          </button>
                        </div>

                        {itemPhotos.length > 0 && (
                          <div className="item-photos">
                            {itemPhotos.map((photo, i) => (
                              <div key={i} className="photo-thumb">
                                <img src={photo} alt="" />
                                <button className="photo-remove" onClick={() => removePhoto(key, i)}>×</button>
                              </div>
                            ))}
                          </div>
                        )}

                        <input
                          type="text"
                          className="item-note"
                          placeholder="Dodaj opombo..."
                          value={note}
                          onChange={e => handleNoteChange(key, e.target.value)}
                        />
                      </div>
                    )
                  })}
                </div>
              )}
            </div>
          )
        })}
      </main>

      <input
        type="file"
        accept="image/*"
        capture="environment"
        ref={fileInputRef}
        onChange={handleFileChange}
        style={{ display: 'none' }}
      />

      <footer>
        <button className="btn-export" onClick={exportReport}>
          📤 Izvozi poročilo
        </button>
      </footer>
    </div>
  )
}

export default App
