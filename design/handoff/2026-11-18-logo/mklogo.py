import sys, re, itertools
D=sys.argv[1]
# 유리 키캡: 둥근 모서리 정육면체(등각 투영). 중심 (0,0), 한 변 s
def cube(s):
    h=s*0.5; v=s*0.58
    top=[(0,-h-v/2+0),(s*0.866,-v/2),(0,h-v/2),(-s*0.866,-v/2)]
    P=lambda pts:' '.join(f'{x:.1f},{y:.1f}' for x,y in pts)
    tp=[(0,-s*0.5-0),( s*0.866,0),(0,s*0.5),(-s*0.866,0)]
    tp=[(x,y-s*0.42) for x,y in tp]
    a,b,c,d=tp  # 위, 오른쪽, 아래, 왼쪽
    down=s*0.95
    left=[d,c,(c[0],c[1]+down),(d[0],d[1]+down)]
    right=[c,b,(b[0],b[1]+down),(c[0],c[1]+down)]
    outline=[a,b,(b[0],b[1]+down),(c[0],c[1]+down),(d[0],d[1]+down),d]
    return dict(top=P(tp),left=P(left),right=P(right),outline=P(outline),
                inner=f'M{d[0]:.1f} {d[1]:.1f} L{c[0]:.1f} {c[1]:.1f} L{b[0]:.1f} {b[1]:.1f} M{c[0]:.1f} {c[1]:.1f} L{c[0]:.1f} {c[1]+down:.1f}',
                hl=f'M{d[0]+6:.1f} {d[1]-2:.1f} L{a[0]:.1f} {a[1]+3:.1f} L{b[0]-10:.1f} {b[1]-5:.1f}')
n=itertools.count()
def cube_group(k, s, tf, dark, edge):
    C=cube(s); i=next(n)
    top_op, left_op, right_op = ('.20','.07','.30') if dark else ('.55','.25','.12')
    shade = '#000000' if dark else '#6B7686'
    return f'''<g transform="{tf}" stroke-linejoin="round">
  <polygon points="{C['top']}" fill="#FFFFFF" fill-opacity="{top_op}"/>
  <polygon points="{C['left']}" fill="#FFFFFF" fill-opacity="{left_op}"/>
  <polygon points="{C['right']}" fill="{shade}" fill-opacity="{right_op}"/>
  <polygon points="{C['outline']}" fill="none" stroke="#FF4D2E" stroke-opacity=".75" stroke-width="1.4" transform="translate(-1.3 -.6)"/>
  <polygon points="{C['outline']}" fill="none" stroke="#2F7BFF" stroke-opacity=".75" stroke-width="1.4" transform="translate(1.3 .6)"/>
  <polygon points="{C['outline']}" fill="none" stroke="{edge}" stroke-opacity=".95" stroke-width="1.6"/>
  <path d="{C['inner']}" fill="none" stroke="{edge}" stroke-opacity=".55" stroke-width="1.1"/>
  <path d="{C['hl']}" fill="none" stroke="#FFFFFF" stroke-opacity=".9" stroke-width="2.2" stroke-linecap="round"/>
</g>'''
def logo(dark):
    ink = '#FFFFFF' if dark else '#171719'
    edge = '#FFFFFF' if dark else '#2E2F33'
    i=next(n)
    C=cube(56); tf='translate(194 80) rotate(-16)'
    words=lambda: '<text x="180" y="70">CAREER</text><text x="180" y="130">CAMP</text>'
    return f'''<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 160" width="360" height="160">
  <defs>
    <mask id="out{i}"><rect width="360" height="160" fill="#fff"/><polygon points="{C['outline']}" transform="{tf}" fill="#000"/></mask>
    <clipPath id="in{i}"><polygon points="{C['outline']}" transform="{tf}"/></clipPath>
  </defs>
  <g font-family="Pretendard, 'Helvetica Neue', Arial, sans-serif" font-weight="800" font-size="60" letter-spacing="-2.5" text-anchor="middle">
    <g fill="{ink}" mask="url(#out{i})">{words()}</g>
    <g clip-path="url(#in{i})">
      <g transform="translate(-4.5 -3)" fill="#FF4D2E" opacity=".9">{words()}</g>
      <g transform="translate(1.5 1)" fill="#2F7BFF" opacity=".9">{words()}</g>
      <g transform="translate(-1.5 -1)" fill="{ink}">{words()}</g>
    </g>
  </g>
  {cube_group('l',56,tf,dark,edge)}
</svg>
'''
def icon(bg):
    body = cube_group('i',150,'translate(256 262) rotate(-16)',True,'#FFFFFF')
    rect = f'<rect width="512" height="512" rx="112" fill="{bg}"/>' if bg else ''
    return f'''<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512" width="512" height="512">
  {rect}
  <defs><linearGradient id="ig" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#5B6B80"/><stop offset=".5" stop-color="#2A3340"/><stop offset="1" stop-color="#46536A"/></linearGradient></defs>
  <g transform="translate(256 262) rotate(-16)"><polygon points="{cube(150)['outline']}" fill="url(#ig)"/></g>
  {body}
</svg>
'''
open(f'{D}/logo-on-dark.svg','w').write(logo(True))
open(f'{D}/logo-on-light.svg','w').write(logo(False))
open(f'{D}/icon.svg','w').write(icon('#14191E'))
open(f'{D}/mark.svg','w').write(icon(None))
# 미리보기: SVG를 그대로 넣는다(파일을 img로 넣으면 웹 글꼴이 안 먹는다)
def inl(f,w=None,h=None):
    s=open(f'{D}/{f}').read()
    return re.sub(r'width="\d+" height="\d+"',(f'width="{w}"' if w else '')+(f' height="{h}"' if h else ''),s,count=1)
html='''<!doctype html><meta charset="utf-8"><link rel="stylesheet" href="https://cdn.jsdelivr.net/gh/orioncactus/pretendard@v1.3.9/dist/web/static/pretendard-dynamic-subset.min.css"><style>body{margin:0;font-family:Pretendard}div{display:flex;gap:28px;align-items:center;padding:28px}.d{background:#14191E;color:#fff}.l{background:#fff;color:#171719}svg{display:block}.h{display:flex;gap:8px;align-items:center;font:700 17px Pretendard;padding:0;white-space:nowrap}</style>'''
html+='<div class="d">'+inl('logo-on-dark.svg',360)+inl('icon.svg',128)+inl('icon.svg',48)+'<div class="h">'+inl('mark.svg',26)+'커리어캠프</div></div>'
html+='<div class="l">'+inl('logo-on-light.svg',360)+inl('icon.svg',128)+'<div class="h">'+inl('mark.svg',26)+'커리어캠프</div></div>'
open(f'{D}/preview.html','w').write(html)
