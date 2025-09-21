/*
  Moonshade Events Admin UI
  Libraries: React 18, TailwindCSS, Radix UI (Dropdown/Tabs), framer-motion, lucide-react, sonner
  Persistence: localStorage + shareable URL (base64 in location hash)
*/

import React, { useEffect, useMemo, useRef, useState } from 'react'
import { motion } from 'framer-motion'
import { v4 as uuid } from 'uuid'
import { Card, CardContent, CardHeader, CardTitle } from './components/ui/card'
import { Button } from './components/ui/button'
import { Input } from './components/ui/input'
import { Textarea } from './components/ui/textarea'
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from './components/ui/dropdown-menu'
import { Tabs, TabsContent, TabsList, TabsTrigger } from './components/ui/tabs'
import { Label } from './components/ui/label'
import { toast } from 'sonner'
import { Download, Upload, Share2, Plus, Trash2, Palette, Users2, Grid, Dice5, Shuffle, ChevronLeft, ChevronRight } from 'lucide-react'

const STORAGE_KEY = 'moonshade_events_ui_v1'
const niceColors = ['#0ea5e9','#10b981','#f59e0b','#ef4444','#8b5cf6','#14b8a6','#22c55e','#e11d48','#06b6d4','#f97316']

const defaultTile = (i) => ({ id: uuid(), label: `Tile ${i+1}`, emoji: '', color: '', blocked: false, note: '' })
const makeBoard = (rows=6, cols=9) => ({ rows, cols, tiles: Array.from({length:rows*cols},(_,i)=>defaultTile(i)) })
const makeEvent = (name='New Event') => ({ id: uuid(), name, createdAt: Date.now(), board: makeBoard(6,9), teams: {}, selectedTeamId: null })

const clamp = (n,min,max)=>Math.max(min,Math.min(max,n))
const wrapMove = (pos, steps, size)=>{ let p=pos+steps; while(p<0)p+=size; while(p>=size)p-=size; return p }

const encodeState = (obj)=> btoa(unescape(encodeURIComponent(JSON.stringify(obj))))
const decodeState = (b64)=> JSON.parse(decodeURIComponent(escape(atob(b64))))

function SmallTag({ children }) { return <span className="px-2 py-0.5 text-xs rounded-full bg-white/10 border border-white/10">{children}</span> }
function ColorSwatch({ value, onChange }) {
  return (
    <div className="flex flex-wrap gap-2">
      {niceColors.map(c=> (
        <button key={c} className={`h-7 w-7 rounded-full border ${value===c? 'ring-2 ring-offset-2 ring-white' : ''}`} style={{background:c}} onClick={()=>onChange(c)} title={c} />
      ))}
      <Input type="text" value={value||''} onChange={(e)=>onChange(e.target.value)} placeholder="#hex or css color" className="h-7 w-36" />
    </div>
  )
}

export default function App(){
  const [events, setEvents] = useState({})
  const [eventId, setEventId] = useState(null)
  const [tab, setTab] = useState('board')

  // load
  useEffect(()=>{
    const hash = location.hash.replace(/^#/, '')
    if (hash){
      try{
        const decoded = decodeState(hash)
        setEvents(decoded.events||{})
        setEventId(decoded.eventId || Object.keys(decoded.events||{})[0] || null)
        toast.success('Loaded state from URL')
        return
      }catch{}
    }
    try{
      const raw = localStorage.getItem(STORAGE_KEY); if(!raw) throw 0
      const parsed = JSON.parse(raw)
      setEvents(parsed.events||{})
      setEventId(parsed.eventId || Object.keys(parsed.events||{})[0] || null)
    }catch{
      const e = makeEvent('TileTrials')
      setEvents({[e.id]: e})
      setEventId(e.id)
    }
  },[])

  // persist
  useEffect(()=>{ localStorage.setItem(STORAGE_KEY, JSON.stringify({events,eventId})) }, [events,eventId])

  const current = events[eventId] || null
  const boardSize = current ? current.board.rows * current.board.cols : 0

  function updateCurrent(mutator){
    setEvents(prev=>{
      if(!current) return prev
      const clone = structuredClone(prev)
      mutator(clone[current.id])
      return clone
    })
  }

  // events
  function addEvent(){ const e=makeEvent(`Event ${Object.keys(events).length+1}`); setEvents(p=>({...p,[e.id]:e})); setEventId(e.id); toast.success('Event created') }
  function deleteEvent(id){ setEvents(p=>{ const c={...p}; delete c[id]; return c }); setEventId(cur=>{ if(cur===id){ const rest=Object.keys(events).filter(x=>x!==id); return rest[0]||null } return cur }); toast.message('Event deleted') }
  function duplicateEvent(id){ const src=events[id]; if(!src) return; const clone=structuredClone(src); clone.id=uuid(); clone.name=src.name+' (copy)'; setEvents(p=>({...p,[clone.id]:clone})) }
  function shareLink(){ const b64=encodeState({events,eventId}); const url=`${location.origin}${location.pathname}#${b64}`; navigator.clipboard?.writeText(url); toast.success('Shareable link copied') }

  // board
  function setBoardSize(rows, cols){ updateCurrent(ev=>{ const next=makeBoard(rows,cols); const min=Math.min(ev.board.tiles.length,next.tiles.length); for(let i=0;i<min;i++){ next.tiles[i]={...next.tiles[i],...ev.board.tiles[i]} } ev.board=next; for(const t of Object.values(ev.teams)){ t.position=clamp(t.position??0,0,rows*cols-1) } }) }
  function paintTile(idx, patch){ updateCurrent(ev=>{ ev.board.tiles[idx] = { ...ev.board.tiles[idx], ...patch } }) }

  // teams
  function addTeam(){ updateCurrent(ev=>{ const id=uuid(); const color=niceColors[Object.keys(ev.teams).length % niceColors.length]; ev.teams[id]={ id, name:`Team ${Object.keys(ev.teams).length+1}`, color, members:[], position:0 }; ev.selectedTeamId=id }) }
  function deleteTeam(id){ updateCurrent(ev=>{ delete ev.teams[id]; if(ev.selectedTeamId===id) ev.selectedTeamId=null }) }
  function moveTeam(id, steps){ updateCurrent(ev=>{ const t=ev.teams[id]; if(!t) return; const size=ev.board.rows*ev.board.cols; t.position = wrapMove(t.position??0, steps, size) }) }

  // drag & drop
  const dragPayloadRef = useRef(null)
  function onDragStartTeam(teamId){ dragPayloadRef.current = { type:'team', teamId } }
  function onDropToTile(tileIndex){ const pl=dragPayloadRef.current; if(pl?.type==='team'){ updateCurrent(ev=>{ const t=ev.teams[pl.teamId]; if(t) t.position=tileIndex }) } dragPayloadRef.current=null }

  // keyboard
  useEffect(()=>{
    function onKey(e){
      if(!current?.selectedTeamId) return
      const { rows, cols } = current.board
      const t=current.teams[current.selectedTeamId]; if(!t) return
      const idx = t.position ?? 0
      const r = Math.floor(idx/cols), c = idx%cols
      let n = idx
      if(e.key==='ArrowRight') n = r*cols + clamp(c+1,0,cols-1)
      if(e.key==='ArrowLeft')  n = r*cols + clamp(c-1,0,cols-1)
      if(e.key==='ArrowDown')  n = clamp(r+1,0,rows-1)*cols + c
      if(e.key==='ArrowUp')    n = clamp(r-1,0,rows-1)*cols + c
      if(n!==idx){ e.preventDefault(); updateCurrent(ev=>{ ev.teams[ev.selectedTeamId].position=n }) }
    }
    window.addEventListener('keydown', onKey)
    return ()=>window.removeEventListener('keydown', onKey)
  }, [current?.selectedTeamId, current?.board.rows, current?.board.cols])

  if(!current){
    return (
      <div className="p-6 max-w-6xl mx-auto">
        <SectionTitle title="Moonshade Events Admin" />
        <Card className="p-6">
          <p className="mb-4">No event selected.</p>
          <Button onClick={addEvent}><Plus className="h-4 w-4 mr-2"/>Create Event</Button>
        </Card>
      </div>
    )
  }

  const { board, teams, selectedTeamId } = current
  const teamList = Object.values(teams)

  const teamsAt = useMemo(()=>{
    const map = new Map()
    for(const t of teamList){ const idx = clamp(t.position??0, 0, boardSize-1); if(!map.has(idx)) map.set(idx, []); map.get(idx).push(t) }
    return map
  }, [teamList, boardSize])

  function SectionTitle({ icon: Icon, title, right }){
    return (
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2 text-xl font-semibold">
          {Icon && <Icon className="h-5 w-5"/>} <span>{title}</span>
        </div>
        <div className="flex items-center gap-2">{right}</div>
      </div>
    )
  }

  function BoardGrid(){
    return (
      <div className="grid gap-2" style={{gridTemplateColumns:`repeat(${board.cols}, minmax(0,1fr))`}}>
        {board.tiles.map((tile, idx)=>{
          const here = teamsAt.get(idx) || []
          const blocked = tile.blocked
          return (
            <div key={tile.id} className={`relative rounded-2xl shadow-sm p-2 aspect-square border border-white/10 flex flex-col ${blocked?'opacity-60 grayscale':''}`} style={{background: tile.color || 'transparent'}} onDrop={(e)=>{e.preventDefault(); onDropToTile(idx)}} onDragOver={(e)=>e.preventDefault()} onClick={()=>paintTile(idx,{})} title={`#${idx+1} ${tile.label}`}>
              <div className="flex items-start justify-between">
                <div className="text-xs font-medium bg-white/20 text-white rounded px-1">#{idx+1}</div>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <button className="text-xs px-2 py-1 rounded bg-white/20 hover:bg-white/30">Edit</button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-80 p-2">
                    <div className="space-y-2">
                      <div>
                        <Label>Label</Label>
                        <Input value={tile.label} onChange={(e)=>paintTile(idx,{label:e.target.value})} />
                      </div>
                      <div>
                        <Label>Emoji</Label>
                        <Input value={tile.emoji} onChange={(e)=>paintTile(idx,{emoji:e.target.value})} placeholder="e.g. 🧩" />
                      </div>
                      <div className="space-y-1">
                        <Label>Color</Label>
                        <ColorSwatch value={tile.color} onChange={(v)=>paintTile(idx,{color:v})} />
                      </div>
                      <div className="flex items-center gap-2">
                        <input id={`blocked-${idx}`} type="checkbox" checked={tile.blocked} onChange={(e)=>paintTile(idx,{blocked:e.target.checked})} />
                        <Label htmlFor={`blocked-${idx}`}>Blocked</Label>
                      </div>
                      <div>
                        <Label>Note</Label>
                        <Textarea value={tile.note} onChange={(e)=>paintTile(idx,{note:e.target.value})} rows={3} />
                      </div>
                    </div>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
              <div className="flex-1 flex items-center justify-center text-center">
                <div className="leading-tight">
                  <div className="text-2xl">{tile.emoji}</div>
                  <div className="text-xs font-semibold line-clamp-2">{tile.label}</div>
                </div>
              </div>
              {here.length>0 && (
                <div className="absolute bottom-1 left-1 right-1 flex flex-wrap gap-1">
                  {here.map(t=> (
                    <motion.div key={t.id} layoutId={t.id} draggable onDragStart={()=>onDragStartTeam(t.id)} className={`px-2 py-0.5 text-xs rounded-full border bg-white/80 text-black cursor-grab ${selectedTeamId===t.id?'ring-2 ring-black':''}`} style={{borderColor: t.color}} title={`${t.name} (${t.members.length})`} onClick={(e)=>{ e.stopPropagation(); updateCurrent(ev=>{ ev.selectedTeamId=t.id }) }}>
                      <span className="mr-1" style={{color:t.color}}>●</span>{t.name}
                    </motion.div>
                  ))}
                </div>
              )}
            </div>
          )
        })}
      </div>
    )
  }

  function TeamsPanel(){
    return (
      <div className="space-y-4">
        <div className="flex items-center gap-2">
          <Button onClick={addTeam}><Plus className="h-4 w-4 mr-2"/>Add Team</Button>
          <SmallTag>{Object.keys(teams).length} teams</SmallTag>
        </div>
        <div className="grid md:grid-cols-2 gap-4">
          {teamList.map(t=> (
            <Card key={t.id} className={`${selectedTeamId===t.id?'ring-2 ring-white/60':''}`}>
              <CardHeader className="pb-2">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-base flex items-center gap-2">
                    <span className="h-3 w-3 rounded-full" style={{background:t.color}} />
                    <Input value={t.name} onChange={(e)=>updateCurrent(ev=>{ ev.teams[t.id].name=e.target.value })} className="h-8" />
                  </CardTitle>
                  <div className="flex items-center gap-2">
                    <Button variant="ghost" size="icon" onClick={()=>updateCurrent(ev=>{ ev.selectedTeamId=t.id })} title="Select"><Users2 className="h-4 w-4"/></Button>
                    <Button variant="ghost" size="icon" onClick={()=>deleteTeam(t.id)} title="Delete"><Trash2 className="h-4 w-4"/></Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="pt-0 space-y-3">
                <div className="space-y-1">
                  <Label>Color</Label>
                  <ColorSwatch value={t.color} onChange={(v)=>updateCurrent(ev=>{ ev.teams[t.id].color=v })} />
                </div>
                <div className="space-y-1">
                  <Label>Members (comma-separated)</Label>
                  <Input placeholder="e.g., Alice, Bob, Carol" value={t.members.join(', ')} onChange={(e)=>updateCurrent(ev=>{ ev.teams[t.id].members = e.target.value.split(',').map(s=>s.trim()).filter(Boolean) })} />
                </div>
                <div className="flex items-center gap-2">
                  <Label className="min-w-20">Position</Label>
                  <Input type="number" min={0} max={boardSize-1} value={t.position ?? 0} onChange={(e)=>updateCurrent(ev=>{ ev.teams[t.id].position=clamp(parseInt(e.target.value||'0',10),0,boardSize-1) })} className="w-28" />
                  <Button variant="outline" size="icon" onClick={()=>moveTeam(t.id,-1)} title="Back 1"><ChevronLeft className="h-4 w-4"/></Button>
                  <Button variant="outline" size="icon" onClick={()=>moveTeam(t.id,+1)} title="Forward 1"><ChevronRight className="h-4 w-4"/></Button>
                  <Button variant="secondary" onClick={()=>moveTeam(t.id, Math.floor(Math.random()*6)+1)} title="Roll D6"><Dice5 className="h-4 w-4 mr-2"/>Roll</Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    )
  }

  function BoardPanel(){
    const [rows,setRows]=useState(board.rows)
    const [cols,setCols]=useState(board.cols)
    useEffect(()=>{ setRows(board.rows); setCols(board.cols) },[board.rows,board.cols])

    function quickPaint(){ updateCurrent(ev=>{ ev.board.tiles = ev.board.tiles.map((t,i)=> ({...t, color: i%2===0? '#0f172a26' : '#0f172a33'})) }) }

    return (
      <div className="space-y-4">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Board Settings</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div>
                <Label>Rows</Label>
                <Input type="number" value={rows} min={1} max={20} onChange={(e)=>setRows(clamp(parseInt(e.target.value||'1',10),1,20))} />
              </div>
              <div>
                <Label>Cols</Label>
                <Input type="number" value={cols} min={1} max={20} onChange={(e)=>setCols(clamp(parseInt(e.target.value||'1',10),1,20))} />
              </div>
              <div className="col-span-2 flex items-end gap-2">
                <Button onClick={()=>setBoardSize(rows, cols)}><Grid className="h-4 w-4 mr-2"/>Apply</Button>
                <Button variant="secondary" onClick={quickPaint}><Palette className="h-4 w-4 mr-2"/>Quick Paint</Button>
              </div>
            </div>
            <p className="text-sm text-white/70">Tip: Drag team tokens between tiles. Use arrow keys to move the selected team.</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-base">Board</CardTitle></CardHeader>
          <CardContent><BoardGrid /></CardContent>
        </Card>
      </div>
    )
  }

  function EventsPanel(){
    function exportJSON(){ const data={events,eventId}; const blob=new Blob([JSON.stringify(data,null,2)],{type:'application/json'}); const url=URL.createObjectURL(blob); const a=document.createElement('a'); a.href=url; a.download='moonshade-events.json'; a.click(); URL.revokeObjectURL(url) }
    function importJSON(){ const input=document.createElement('input'); input.type='file'; input.accept='application/json'; input.onchange=async()=>{ const file=input.files?.[0]; if(!file) return; const txt=await file.text(); try{ const parsed=JSON.parse(txt); setEvents(parsed.events||{}); setEventId(parsed.eventId || Object.keys(parsed.events||{})[0] || null); toast.success('Imported state') }catch{ toast.error('Invalid JSON') } }; input.click() }
    function confirmDelete(id){ if(confirm('Delete event? This cannot be undone.')) deleteEvent(id) }

    return (
      <div className="space-y-4">
        <div className="flex items-center gap-2">
          <Button onClick={addEvent}><Plus className="h-4 w-4 mr-2"/>New Event</Button>
          <Button variant="outline" onClick={exportJSON}><Download className="h-4 w-4 mr-2"/>Export</Button>
          <Button variant="outline" onClick={importJSON}><Upload className="h-4 w-4 mr-2"/>Import</Button>
          <Button variant="secondary" onClick={shareLink}><Share2 className="h-4 w-4 mr-2"/>Share Link</Button>
        </div>
        <div className="grid md:grid-cols-2 gap-4">
          {Object.values(events).map(e=> (
            <Card key={e.id} className={`${e.id===eventId?'ring-2 ring-white/60':''}`}>
              <CardHeader className="pb-2"><CardTitle className="text-base">{e.name}</CardTitle></CardHeader>
              <CardContent className="space-y-3">
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <Label>Name</Label>
                    <Input value={e.name} onChange={(ev2)=>setEvents(p=>({...p,[e.id]:{...p[e.id], name: ev2.target.value}}))} />
                  </div>
                  <div>
                    <Label>Created</Label>
                    <Input readOnly value={new Date(e.createdAt).toLocaleString()} />
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Button variant="secondary" onClick={()=>setEventId(e.id)}>Open</Button>
                  <Button variant="ghost" onClick={()=>duplicateEvent(e.id)}>Duplicate</Button>
                  <Button variant="ghost" onClick={()=>confirmDelete(e.id)}><Trash2 className="h-4 w-4 mr-2"/>Delete</Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-muted p-4 md:p-8 text-foreground">
      <div className="max-w-7xl mx-auto space-y-4">
        <header className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="text-2xl font-bold tracking-tight">Moonshade Events Admin</div>
            <SmallTag>{current.name}</SmallTag>
          </div>
          <div className="flex items-center gap-2">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline">Switch Event</Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                {Object.values(events).map(e=>(
                  <DropdownMenuItem key={e.id} onClick={()=>setEventId(e.id)}>{e.name}</DropdownMenuItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>
            <Button variant="ghost" onClick={()=>{ if(confirm('Reset ALL data?')){ setEvents({}); setEventId(null); localStorage.removeItem(STORAGE_KEY) } }}>Reset</Button>
          </div>
        </header>

        <Tabs value={tab} onValueChange={setTab}>
          <TabsList className="grid grid-cols-3 w-full md:w-auto">
            <TabsTrigger value="board" className="flex items-center gap-2"><Grid className="h-4 w-4"/>Board</TabsTrigger>
            <TabsTrigger value="teams" className="flex items-center gap-2"><Users2 className="h-4 w-4"/>Teams</TabsTrigger>
            <TabsTrigger value="events" className="flex items-center gap-2"><Shuffle className="h-4 w-4"/>Events</TabsTrigger>
          </TabsList>
          <TabsContent value="board" className="mt-4"><BoardPanel /></TabsContent>
          <TabsContent value="teams" className="mt-4"><TeamsPanel /></TabsContent>
          <TabsContent value="events" className="mt-4"><EventsPanel /></TabsContent>
        </Tabs>

        <Card>
          <CardContent className="p-4 flex flex-col md:flex-row md:items-center gap-3 justify-between">
            <div className="text-sm text-white/70"><b>Tips</b>: Select a team to move with arrow keys. Export JSON for your Discord bot.</div>
            {selectedTeamId && (
              <div className="flex items-center gap-2">
                <SmallTag>Selected: {teams[selectedTeamId]?.name}</SmallTag>
                <Button variant="outline" size="icon" onClick={()=>moveTeam(selectedTeamId, -1)}><ChevronLeft className="h-4 w-4"/></Button>
                <Button variant="outline" size="icon" onClick={()=>moveTeam(selectedTeamId, +1)}><ChevronRight className="h-4 w-4"/></Button>
                <Button onClick={()=>moveTeam(selectedTeamId, Math.floor(Math.random()*6)+1)}><Dice5 className="h-4 w-4 mr-2"/>Roll</Button>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
