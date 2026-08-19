#!/usr/bin/env python3
"""Generate BeatForge's 26 audio assets using only Python's standard library."""
import math, os, random, struct, wave
SR=44100; OUT=os.path.join(os.path.dirname(__file__),'..','assets','samples'); os.makedirs(OUT,exist_ok=True)
def sine(f,t): return math.sin(2*math.pi*f*t)
def saw(f,t): return 2*((f*t)%1)-1
def rnd(r): return r.uniform(-1,1)
def render(name,dur,fn):
    vals=[fn(i/SR) for i in range(int(SR*dur))]; peak=max(1e-9,max(abs(x) for x in vals));
    with wave.open(os.path.join(OUT,name),'wb') as w:
        w.setnchannels(1); w.setsampwidth(2); w.setframerate(SR); w.writeframes(b''.join(struct.pack('<h',int(max(-1,min(1,x*.88/peak))*32767)) for x in vals))
def one_shots():
    R=random.Random(7)
    render('kick_808.wav',.85,lambda t:(sine(42+105*math.exp(-t/.018),t)*math.exp(-t/.12)+rnd(R)*math.exp(-t/.008)*.12)*1.7)
    render('kick_punch.wav',.45,lambda t:(sine(55+180*math.exp(-t/.008),t)*math.exp(-t/.055)+rnd(R)*math.exp(-t/.012)*.35)*1.5)
    render('snare.wav',.42,lambda t:(.5*(sine(190,t)+.5*sine(320,t))*math.exp(-t/.07)+rnd(R)*.75)*math.exp(-t/.11))
    render('clap.wav',.55,lambda t:sum(rnd(R)*math.exp(-(t-o)/.035) for o in (0,.012,.024) if t>=o)*.55)
    render('hat_closed.wav',.09,lambda t:(rnd(R)*.7+.25*saw(6000,t))*math.exp(-t/.018))
    render('hat_open.wav',.30,lambda t:(rnd(R)*.7+.25*saw(5200,t))*math.exp(-t/.22))
    render('shaker.wav',.18,lambda t:rnd(R)*.7*math.exp(-t/.08))
    render('rimshot.wav',.13,lambda t:(.7*sine(1500,t)+.4*sine(430,t))*math.exp(-t/.035)+rnd(R)*.2*math.exp(-t/.01))
    render('tom_low.wav',.60,lambda t:sine(105+90*math.exp(-t/.04),t)*math.exp(-t/.16))
    render('tom_mid.wav',.50,lambda t:sine(155+100*math.exp(-t/.035),t)*math.exp(-t/.13))
    render('bass_808.wav',1.6,lambda t:math.tanh(sine(41.2,t)*2.2)*math.exp(-t/.7))
    render('bass_slide.wav',1.4,lambda t:math.tanh(sine(82.4*(41.2/82.4)**((min(1,t/1.4))**.7),t)*2)*math.exp(-t/.55))
    for name,ivs in [('synth_chord_min.wav',(0,3,7,10)),('synth_chord_maj.wav',(0,4,7,11))]: render(name,1.9,lambda t,ivs=ivs:sum(saw(220*2**(i/12),t)+.25*sine(440*2**(i/12),t) for i in ivs)/len(ivs)*.5*math.exp(-t/.7))
    render('synth_stab.wav',.5,lambda t:sum(.2*saw(440*2**(i/12),t) for i in (0,7,12,15))*math.exp(-t/.09))
    render('fx_drop.wav',2,lambda t:(saw(900*(30/900)**((min(1,t/2))**.55),t)*.55)*math.exp(-t/.5))
    render('fx_riser.wav',2,lambda t:(rnd(R)*(.3+.7*min(1,t/2))+.2*sine(200*2**(2.4*min(1,t/2)),t))*min(1,t/2)**1.4)
    render('vinyl_stop.wav',1.6,lambda t:rnd(R)*.5*math.exp(-t/.5)*(1-min(1,t/1.6)))
def loop(name,fn,low=False):
    n=int(SR*4); cut=1400 if low else 18000; a=math.exp(-2*math.pi*cut/SR); prev=0; vals=[]
    for i in range(n):
        v=fn(i/SR)
        if low: prev=(1-a)*v+a*prev; v=prev
        vals.append(v)
    peak=max(1e-9,max(abs(x) for x in vals))
    with wave.open(os.path.join(OUT,name),'wb') as w:
        w.setnchannels(1); w.setsampwidth(2); w.setframerate(SR); w.writeframes(b''.join(struct.pack('<h',int(max(-1,min(1,x*.82/peak))*32767)) for x in vals))
def stems():
    R=random.Random(11)
    def drums(t):
        step=int(t/.125); local=t%0.125; v=0
        if step%4==0: v+=math.sin(2*math.pi*(42+105*math.exp(-(t%0.5)/.018))*(t%0.5))*math.exp(-(t%0.5)/.12)*.7
        if step%8==4: v+=R.uniform(-1,1)*math.exp(-(t%0.5)/.11)*.5
        if local<.006: v+=R.uniform(-1,1)*math.exp(-local/.018)*.25
        return v
    def bass(t): return sine((41.2,49,55,36.7)[int(t/.5)%4],t)*math.exp(-(t%.5)/.28)*.55
    def melody(t): return sine((220,261.6,329.6,293.7)[int(t/.5)%4],t)*math.exp(-(t%.5)/.45)*.32
    def vocal(t):
        x=t%1; return (sine(730,t)+.5*sine(1090,t)+.3*sine(2440,t))*math.exp(-x/.22)*.15
    for base,fn in [('loop_drums',drums),('loop_bass',bass),('loop_melody',melody),('loop_vocal',vocal)]: loop(base+'.wav',fn); loop(base+'_lpf.wav',fn,True)
one_shots(); stems(); print('Generated',OUT)
