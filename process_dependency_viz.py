"""
process_dependency_viz.py
Generates a self-contained interactive HTML dependency graph
from the IGM process module definitions.

Module I/O is loaded from module_io.yaml — edit that file to update the graph.
"""

import json
import os
import yaml
from collections import defaultdict

# ── Load module I/O from YAML (single source of truth) ───────────────────────
_yaml_path = os.path.join(os.path.dirname(__file__), "module_io.yaml")
with open(_yaml_path, "r", encoding="utf-8") as _f:
    _module_io = yaml.safe_load(_f)

CORE_PROCESSES = {
    k: {"needs": v.get("needs", []), "updates": v.get("updates", [])}
    for k, v in _module_io.items()
    if not v.get("community")
}
COMMUNITY_PROCESSES = {
    k: {"needs": v.get("needs", []), "updates": v.get("updates", [])}
    for k, v in _module_io.items()
    if v.get("community")
}

# Graph uses core modules only
ALL_PROCESSES = CORE_PROCESSES
COMMUNITY_NAMES = set()

OUTPUT_FILE = "docs/assets/dependency_graph.html"

PALETTE = [
    "#4667a4",  # core: blue
    "#3a9e7a",  # core: teal
    "#b85c38",  # core: rust
    "#7b56b0",  # core: purple
    "#c4972a",  # core: amber
    "#2a8fb0",  # core: cyan
    "#a44670",  # community: pink
    "#6a7f3a",  # community: olive
    "#b04a4a",  # community: red
    "#5a7ab8",  # community: steel
]

COMMUNITY_PALETTE = ["#e07b55", "#d4a843", "#7aad6a", "#6a9ecf", "#c46fae"]


# ── Grouping logic ─────────────────────────────────────────────────────────────
def compute_groups(processes: dict) -> tuple:
    all_vars: set = set()
    for d in processes.values():
        all_vars.update(d["needs"])
        all_vars.update(d["updates"])

    sig_to_vars: dict = defaultdict(list)
    for var in sorted(all_vars):
        readers = frozenset(p for p, d in processes.items() if var in d["needs"])
        writers = frozenset(p for p, d in processes.items() if var in d["updates"])
        sig_to_vars[(readers, writers)].append(var)

    var_to_group: dict = {}
    group_members: dict = {}

    for _sig, members in sig_to_vars.items():
        gid = " · ".join(sorted(members))
        group_members[gid] = sorted(members)
        for v in members:
            var_to_group[v] = gid

    return var_to_group, group_members


def build_html(processes: dict, community_names: set) -> str:
    all_proc_names = list(processes.keys())
    proc_colors = {}
    ci, cmi = 0, 0
    for name in all_proc_names:
        if name in community_names:
            proc_colors[name] = COMMUNITY_PALETTE[cmi % len(COMMUNITY_PALETTE)]
            cmi += 1
        else:
            proc_colors[name] = PALETTE[ci % len(PALETTE)]
            ci += 1

    var_to_group, group_members = compute_groups(processes)

    # Remap edges to group ids (de-duplicate)
    group_links = []
    seen: set = set()
    for proc, data in processes.items():
        for src_var in data["needs"]:
            for dst_var in data["updates"]:
                sg = var_to_group[src_var]
                tg = var_to_group[dst_var]
                key = (sg, tg, proc)
                if key not in seen:
                    seen.add(key)
                    group_links.append({
                        "source": sg,
                        "target": tg,
                        "proc":   proc,
                        "color":  proc_colors[proc],
                        "self":   sg == tg,
                        "community": proc in community_names,
                    })

    nodes_data = [
        {"id": gid, "members": members, "grouped": len(members) > 1}
        for gid, members in group_members.items()
    ]

    js_processes = json.dumps(
        {n: {
            "needs":     d["needs"],
            "updates":   d["updates"],
            "color":     proc_colors[n],
            "community": n in community_names,
        } for n, d in processes.items()},
        indent=2,
    )
    js_nodes = json.dumps(nodes_data, indent=2)
    js_links = json.dumps(group_links, indent=2)

    return f"""<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>IGM State Variable Dependency Graph</title>
  <style>
    *, *::before, *::after {{ box-sizing: border-box; margin: 0; padding: 0; }}

    body {{
      background: #0f1117;
      color: #e8eaf0;
      font-family: 'Inter', monospace, sans-serif;
      display: flex;
      flex-direction: column;
      align-items: center;
      min-height: 100vh;
      padding: 20px 16px;
    }}

    h1 {{
      font-size: 15px;
      font-weight: 600;
      color: #9da3b0;
      letter-spacing: .06em;
      text-transform: uppercase;
      margin-bottom: 12px;
    }}

    #controls {{
      display: flex;
      flex-wrap: wrap;
      gap: 6px;
      align-items: center;
      margin-bottom: 10px;
      width: 100%;
    }}

    #controls span {{
      font-size: 11px;
      color: #9da3b0;
    }}

    .proc-btn {{
      font-size: 11px;
      font-family: monospace;
      padding: 3px 10px;
      border-radius: 20px;
      cursor: pointer;
      border: 1.5px solid;
      background: transparent;
      transition: background .15s, color .15s;
    }}

    .proc-btn.active {{
      color: #0f1117 !important;
    }}

    #btn-all {{
      border-color: #4a90d9;
      color: #4a90d9;
      border-style: solid;
    }}

    #btn-all.active {{
      background: #4a90d9;
    }}

    #graph-container {{
      width: 100%;
      border-radius: 10px;
      overflow: hidden;
      border: 1px solid #1e2a3a;
      background: #0f1117;
    }}

    svg {{
      display: block;
      width: 100%;
    }}

    .tooltip {{
      position: fixed;
      background: #1e2130;
      border: 1px solid #4a90d9;
      color: #e8eaf0;
      font-size: 12px;
      font-family: monospace;
      padding: 6px 10px;
      border-radius: 6px;
      pointer-events: none;
      opacity: 0;
      transition: opacity .15s;
      white-space: pre;
      z-index: 10;
    }}

    #legend {{
      margin-top: 8px;
      font-size: 11px;
      color: #5a6070;
    }}
  </style>
</head>
<body>
  <h1>State Variable Dependency Graph</h1>

  <div id="controls">
    <span>Highlight:</span>
    <button class="proc-btn active" id="btn-all" onclick="filterProc(null)">All</button>
  </div>

  <div id="graph-container"><svg id="graph"></svg></div>

  <div id="legend">Drag nodes · Hover to inspect</div>

  <div class="tooltip" id="tooltip"></div>

  <script src="https://cdnjs.cloudflare.com/ajax/libs/d3/7.9.0/d3.min.js"></script>

  <script>
  const PROCESSES  = {js_processes};
  const NODES_DATA = {js_nodes};
  const LINKS_DATA = {js_links};

  const W = 1100, H = 680;
  const NODE_R    = 30;
  const PADDING_X = 20;
  const PADDING_Y = 12;
  const LINE_H    = 17;
  const ARROW_LEN = 8;

  const PRELAYOUT_ATTEMPTS = 180;
  const PRELAYOUT_TICKS    = 300;

  function charW(s) {{ return s.length * 7.2; }}

  for (const n of NODES_DATA) {{
    n.shape = 'circle';
    if (!n.grouped) {{
      n.r = NODE_R;
    }} else {{
      const maxTextW = Math.max(...n.members.map(m => charW(m)));
      const neededByTextWidth = maxTextW / 2 + PADDING_X;
      const neededByTextHeight = n.members.length * LINE_H / 2 + PADDING_Y;
      n.r = Math.max(NODE_R, Math.ceil(Math.max(neededByTextWidth, neededByTextHeight)));
    }}
  }}

  const nodeById = Object.fromEntries(NODES_DATA.map(n => [n.id, n]));

  const links       = LINKS_DATA.map(l => ({{ ...l }}));
  const normalLinks = links.filter(l => !l.self);
  const selfLinks   = links.filter(l => l.self);

  function endpointId(x) {{ return typeof x === 'object' ? x.id : x; }}

  function seededRandom(seed) {{
    let t = seed + 0x6D2B79F5;
    return function() {{
      t += 0x6D2B79F5;
      let r = Math.imul(t ^ (t >>> 15), 1 | t);
      r ^= r + Math.imul(r ^ (r >>> 7), 61 | r);
      return ((r ^ (r >>> 14)) >>> 0) / 4294967296;
    }};
  }}

  function orient(a, b, c) {{ return (b.x-a.x)*(c.y-a.y)-(b.y-a.y)*(c.x-a.x); }}

  function segmentsIntersect(a,b,c,d) {{
    const eps=1e-9, o1=orient(a,b,c), o2=orient(a,b,d), o3=orient(c,d,a), o4=orient(c,d,b);
    return o1*o2<-eps && o3*o4<-eps;
  }}

  function countCrossings(nodes, candidateLinks) {{
    const byId = Object.fromEntries(nodes.map(n=>[n.id,n]));
    let crossings = 0;
    for (let i=0;i<candidateLinks.length;i++) {{
      const a=endpointId(candidateLinks[i].source), b=endpointId(candidateLinks[i].target);
      for (let j=i+1;j<candidateLinks.length;j++) {{
        const c=endpointId(candidateLinks[j].source), d=endpointId(candidateLinks[j].target);
        if (a===c||a===d||b===c||b===d) continue;
        const p1=byId[a],p2=byId[b],p3=byId[c],p4=byId[d];
        if (!p1||!p2||!p3||!p4) continue;
        if (segmentsIntersect(p1,p2,p3,p4)) crossings++;
      }}
    }}
    return crossings;
  }}

  function totalEdgeLength(nodes, candidateLinks) {{
    const byId = Object.fromEntries(nodes.map(n=>[n.id,n]));
    let total=0;
    for (const l of candidateLinks) {{
      const s=byId[endpointId(l.source)], t=byId[endpointId(l.target)];
      if (!s||!t) continue;
      const dx=t.x-s.x, dy=t.y-s.y;
      total+=Math.sqrt(dx*dx+dy*dy);
    }}
    return total;
  }}

  function makeCandidateLayout(seed, ticks) {{
    const rand=seededRandom(seed), nNodes=NODES_DATA.length;
    const candidateNodes=NODES_DATA.map((n,i) => {{
      const angle=2*Math.PI*(i/Math.max(1,nNodes))+rand()*0.8;
      const radius=Math.min(W,H)*(0.25+rand()*0.18);
      return {{...n, x:W/2+radius*Math.cos(angle), y:H/2+radius*Math.sin(angle), vx:0, vy:0}};
    }});
    const candidateLinks=normalLinks.map(l=>({{'source':endpointId(l.source),'target':endpointId(l.target)}}));
    const candidateSim=d3.forceSimulation(candidateNodes)
      .force('link',d3.forceLink(candidateLinks).id(d=>d.id).distance(155).strength(0.45))
      .force('charge',d3.forceManyBody().strength(-520))
      .force('center',d3.forceCenter(W/2,H/2))
      .force('x',d3.forceX(W/2).strength(0.025))
      .force('y',d3.forceY(H/2).strength(0.025))
      .force('collision',d3.forceCollide(d=>d.r+18))
      .stop();
    for (let i=0;i<ticks;i++) candidateSim.tick();
    const crossings=countCrossings(candidateNodes,candidateLinks);
    const edgeLength=totalEdgeLength(candidateNodes,candidateLinks);
    return {{nodes:candidateNodes, crossings, edgeLength, score:crossings*100000+edgeLength}};
  }}

  function optimizeInitialLayout(attempts=PRELAYOUT_ATTEMPTS, ticks=PRELAYOUT_TICKS) {{
    if (NODES_DATA.length<=2||normalLinks.length<=1) return;
    let best=null;
    for (let seed=1;seed<=attempts;seed++) {{
      const candidate=makeCandidateLayout(seed,ticks);
      if (!best||candidate.score<best.score) best=candidate;
      if (best.crossings===0) break;
    }}
    if (!best) return;
    const bestById=Object.fromEntries(best.nodes.map(n=>[n.id,n]));
    for (const n of NODES_DATA) {{
      const b=bestById[n.id]; if (!b) continue;
      n.x=b.x; n.y=b.y; n.vx=0; n.vy=0;
    }}
  }}

  optimizeInitialLayout();

  const pairMap={{}};
  for (const l of normalLinks) {{
    const key=[endpointId(l.source),endpointId(l.target)].sort().join('||');
    if (!pairMap[key]) pairMap[key]=[];
    pairMap[key].push(l);
  }}
  for (const arr of Object.values(pairMap)) {{
    arr.forEach((l,i) => {{ l.curveOffset=(i+1)*0.28*(i%2===0?1:-1); }});
  }}

  const svg=d3.select('#graph').attr('viewBox',`0 0 ${{W}} ${{H}}`).attr('height',H);
  const defs=svg.append('defs');

  for (const [proc,data] of Object.entries(PROCESSES)) {{
    defs.append('marker').attr('id',`arr-${{proc}}`)
      .attr('viewBox','0 0 10 10').attr('refX',8).attr('refY',5)
      .attr('markerWidth',5).attr('markerHeight',5).attr('orient','auto')
      .append('path').attr('d','M1 1L9 5L1 9').attr('fill',data.color);
  }}

  const edgeG=svg.append('g');
  const selfG=svg.append('g');
  const nodeG=svg.append('g');

  const edgePaths=edgeG.selectAll('path').data(normalLinks).join('path')
    .attr('fill','none').attr('stroke-width',2).attr('opacity',0.88)
    .attr('stroke',d=>d.color)

    .attr('marker-end',d=>`url(#arr-${{d.proc}})`);

  const selfPaths=selfG.selectAll('path').data(selfLinks).join('path')
    .attr('fill','none').attr('stroke-width',2).attr('opacity',0.88)
    .attr('stroke',d=>d.color)

    .attr('marker-end',d=>`url(#arr-${{d.proc}})`);

  const tooltip=document.getElementById('tooltip');

  const nodeGroups=nodeG.selectAll('g').data(NODES_DATA).join('g')
    .attr('cursor','grab')
    .call(d3.drag()
      .on('start',(ev,d)=>{{if (!ev.active) sim.alphaTarget(0.3).restart(); d.fx=d.x; d.fy=d.y;}})
      .on('drag',(ev,d)=>{{d.fx=ev.x; d.fy=ev.y;}})
      .on('end',(ev,d)=>{{if (!ev.active) sim.alphaTarget(0); d.fx=null; d.fy=null;}})
    );

  nodeGroups.append('circle').attr('r',d=>d.r)
    .attr('fill','#1e2130').attr('stroke','#4a90d9').attr('stroke-width',2);

  nodeGroups.each(function(d) {{
    const g=d3.select(this), total=d.members.length;
    d.members.forEach((m,i) => {{
      const yOff=(i-(total-1)/2)*LINE_H;
      g.append('text').text(m).attr('x',0).attr('y',yOff)
        .attr('text-anchor','middle').attr('dominant-baseline','central')
        .attr('fill','#e8eaf0').attr('font-size','12px')
        .attr('font-weight','bold').attr('font-family','monospace')
        .attr('pointer-events','none');
    }});
  }});

  nodeGroups
    .on('mouseenter',(ev,d)=>{{
      const vars=d.members;
      const readers=Object.entries(PROCESSES).filter(([,p])=>vars.some(v=>p.needs.includes(v))).map(([n])=>n);
      const writers=Object.entries(PROCESSES).filter(([,p])=>vars.some(v=>p.updates.includes(v))).map(([n])=>n);
      const label=vars.length>1?`[${{vars.join(', ')}}] grouped`:vars[0];
      tooltip.textContent=`${{label}}\\n  read by : ${{readers.join(', ')||'—'}}\\n  written : ${{writers.join(', ')||'—'}}`;
      tooltip.style.opacity=1;
      edgePaths.attr('opacity',l=>l.source.id===d.id||l.target.id===d.id?1:0.06);
      selfPaths.attr('opacity',l=>{{const sid=typeof l.source==='object'?l.source.id:l.source; return sid===d.id?1:0.06;}});
    }})
    .on('mousemove',ev=>{{tooltip.style.left=(ev.clientX+14)+'px'; tooltip.style.top=(ev.clientY-10)+'px';}})
    .on('mouseleave',()=>{{tooltip.style.opacity=0; activeProc===null?restoreOpacity():filterProc(activeProc);}});

  function restoreOpacity() {{ edgePaths.attr('opacity',0.88); selfPaths.attr('opacity',0.88); }}

  const sim=d3.forceSimulation(NODES_DATA)
    .force('link',d3.forceLink(normalLinks).id(d=>d.id).distance(155).strength(0.45))
    .force('charge',d3.forceManyBody().strength(-520))
    .force('center',d3.forceCenter(W/2,H/2))
    .force('x',d3.forceX(W/2).strength(0.025))
    .force('y',d3.forceY(H/2).strength(0.025))
    .force('collision',d3.forceCollide(d=>d.r+18))
    .alpha(0.35).alphaDecay(0.045);

  function boundaryPoint(n,theta) {{ return {{x:n.x+n.r*Math.cos(theta), y:n.y+n.r*Math.sin(theta)}}; }}

  function curvePath(s,t,offset) {{
    const mx=(s.x+t.x)/2, my=(s.y+t.y)/2, dx=t.x-s.x, dy=t.y-s.y;
    const cx=mx-dy*offset, cy=my+dx*offset;
    const etx=t.x-cx, ety=t.y-cy, elen=Math.sqrt(etx*etx+ety*ety)||1;
    const tp=boundaryPoint(t,Math.atan2(ety,etx)+Math.PI);
    const ex=tp.x-(etx/elen)*ARROW_LEN*0.5, ey=tp.y-(ety/elen)*ARROW_LEN*0.5;
    const stx=cx-s.x, sty=cy-s.y;
    const sp=boundaryPoint(s,Math.atan2(sty,stx));
    return `M${{sp.x}},${{sp.y}} Q${{cx}},${{cy}} ${{ex}},${{ey}}`;
  }}

  function selfLoopPath(node,idx) {{
    const r=node.r, angle=Math.PI/2+idx*(Math.PI/3), halfSpan=0.5;
    const p0=boundaryPoint(node,angle-halfSpan), p3=boundaryPoint(node,angle+halfSpan);
    const apex=r*(3.0+idx*0.5), ax=node.x+apex*Math.cos(angle), ay=node.y+apex*Math.sin(angle);
    const p1x=p0.x+(ax-p0.x)*0.85, p1y=p0.y+(ay-p0.y)*0.85;
    const p2x=p3.x+(ax-p3.x)*0.85, p2y=p3.y+(ay-p3.y)*0.85;
    const tdx=p3.x-p2x, tdy=p3.y-p2y, tlen=Math.sqrt(tdx*tdx+tdy*tdy)||1;
    return `M${{p0.x}},${{p0.y}} C${{p1x}},${{p1y}} ${{p2x}},${{p2y}} ${{p3.x-(tdx/tlen)*ARROW_LEN*0.5}},${{p3.y-(tdy/tlen)*ARROW_LEN*0.5}}`;
  }}

  const selfByNode={{}};
  for (const l of selfLinks) {{
    const nid=typeof l.source==='object'?l.source.id:l.source;
    if (!selfByNode[nid]) selfByNode[nid]=[];
    selfByNode[nid].push(l);
  }}

  sim.on('tick',()=>{{
    edgePaths.attr('d',d=>curvePath(d.source,d.target,d.curveOffset||0.2));
    selfPaths.attr('d',function(d) {{
      const nid=typeof d.source==='object'?d.source.id:d.source;
      const node=nodeById[nid];
      return selfLoopPath(node,selfByNode[nid].indexOf(d));
    }});
    nodeGroups.attr('transform',d=>`translate(${{d.x}},${{d.y}})`);
  }});

  let activeProc=null;

  function filterProc(proc) {{
    activeProc=proc;
    edgePaths.attr('opacity',l=>proc===null||l.proc===proc?0.88:0.06);
    selfPaths.attr('opacity',l=>proc===null||l.proc===proc?0.88:0.06);
    document.querySelectorAll('.proc-btn').forEach(b=>{{b.classList.remove('active'); b.style.background='transparent';}});
    const active=proc===null?document.getElementById('btn-all'):document.getElementById(`btn-${{proc}}`);
    if (active) {{ active.classList.add('active'); active.style.background=active.style.borderColor; }}
  }}

  window.filterProc=filterProc;

  const controls=document.getElementById('controls');
  for (const [proc,data] of Object.entries(PROCESSES)) {{
    const btn=document.createElement('button');
    btn.id=`btn-${{proc}}`;
    btn.className='proc-btn'+(data.community?' community':'');
    btn.textContent=proc;
    btn.style.borderColor=data.color;
    btn.style.color=data.color;
    btn.onclick=()=>filterProc(activeProc===proc?null:proc);
    controls.appendChild(btn);
  }}

  filterProc(null);
  </script>
</body>
</html>
"""


def main():
    os.makedirs(os.path.dirname(OUTPUT_FILE), exist_ok=True)
    html = build_html(ALL_PROCESSES, COMMUNITY_NAMES)
    with open(OUTPUT_FILE, "w", encoding="utf-8") as f:
        f.write(html)
    size_kb = os.path.getsize(OUTPUT_FILE) / 1024
    print(f"Saved → {OUTPUT_FILE}  ({size_kb:.1f} KB)")


if __name__ == "__main__":
    main()
