Attribute VB_Name = "Module1"
Declare Function ShowCursor Lib "user32" (ByVal bShow As Long) As Long

Option Explicit

#Const DEBUGMODE = True

Dim DATAFILE As String

Global GameMode As Integer
Global Const GM_ADVENTURE = 0
Global Const GM_MASSACRE = 1

Const GRAVITY = 15

Global MouseIsDown As Boolean
Global MouseLoc As vect

Global PlayMusic As Integer
Global PlaySounds As Integer
Global PlayAmbience As Integer
Global WeatherStuff As Integer

Global Const BUSFRAMES = 2
Const DIFFFAIRIES = 100
Const MAXGIFTS = 5
Global Const MAXFAIRIES = 200
Global Const MAXFTYPES = 15
Const MAXSOUNDS = 30
Const MAXSCOREGFX = 7
Const MAXSCORESONSCREEN = 15
Const SCREENTOP = 83

Global Const GIFTSPEED = 60

Const GORELEVEL = 1


Const DEAD = 0
Const DYING = 1
Const ALIVE = 2
Const ACTING = 3

Const MAXSPEED = 500
Global Const MAXWEAPS = 9
Const g = 100
Const MAXMINES = 10


Const fairy = 0
Const WALKER = 1
Const SITTER = 2
Const FLYER = 3


Type vect
   x As Single
   y As Single
End Type

Type ScoreGFX
   loc As vect
   spawntime As Long
   speed As Single
   key As Integer
   width As Integer
   height As Integer
   sdex As Integer
   frame As Integer
   show As Boolean
End Type
   
Type StaticSprite
   key As Integer
   loc As vect
   width As Integer
   height As Integer
   frame As Integer
   sdex As Integer
   show As Boolean
   ltime As Long
End Type
   
   


Type PlayerStats
   score As Long
   shots As Long
   hits As Long
   rank As Long
   percent As Single
   damagedone As Long 'damage to fairies done
   reaction As Double ' time reaction
   
End Type

Type fairystats
    name As String
    shotcount As Long
End Type

Type gunusage
    wepnum As Integer
    name As String
    shots As Long
End Type


Type userinfo
   name As String
   pword As String
   score As Long
   shots As Long
   hits As Long
   rank As Integer
   longstreak As Integer
   favweap(MAXWEAPS) As gunusage
   KillFairy(DIFFFAIRIES) As fairystats
   levelsplayed As Integer
   scenario As Integer
End Type

Type fairy
    gift As Integer
    flip As Integer
    maxhp As Integer
    hp As Integer
    id As String
    name As String
    loc As vect
    move As vect
    frame As Integer
    stat As Integer
    pic As Integer
    dpic As Integer
    apic As Integer
    drawpic As Integer
    rprob As Integer
    asound As Integer
    size As Integer
    fcount As Integer
    ltime As Long
    intel As Integer
    speed As Integer
    fdie1 As Integer
    fdie2 As Integer
    class As Integer
    worth As Integer
End Type

Const SNIPE = 0
Const BLASTER = 1
Const SNIPERAP = 2
Const BLASTERRAP = 3
Const DABUS = 4
Const FMINE = 5
Const ION = 6
Const PIANO = 7
Const HOLE = 8

Type gun
   type As Integer
   sprite As Integer
   name As String
   ammo As Integer
   power As Integer
   BLAST As Integer
   Sound As Integer
   delay As Long
   last As Long
   shotcount As Long
End Type

Type level
    name As String
    bgpic As String
    numfairies As Integer ' ??
    sngname As String
    timelimit As Integer
    fguys As Integer    ' # of different fairy types (<= MAXFTYPES)
    numof(1 To MAXFTYPES) As Integer ' # of each type of fairy
    ftypes(1 To MAXFTYPES) As fairy ' holds info for each fairy type
    next As String   ' next level name (id)
    shots As Integer
    hits As Integer
    kills As Integer
    fground As String
    drawfg As Boolean
    ambient As Integer
    weather As String
End Type
    
Dim DScore As Long

Dim pstats As PlayerStats
Dim flist(0 To MAXFAIRIES) As fairy
Dim fsounds(1 To MAXSOUNDS) As Integer
Dim fscores(1 To MAXSCOREGFX) As StaticSprite
Dim ShowScores(0 To MAXSCORESONSCREEN - 1) As ScoreGFX
Dim fmines(1 To MAXMINES) As StaticSprite
Dim FHoles(1 To MAXMINES) As StaticSprite

' Splats
Const MAXSPLATS = 300
Type Splat
    loc As vect
    vel As vect
    sdex As Integer
    frame As Integer
    show As Boolean
End Type

Dim FSplats(0 To MAXSPLATS - 1) As Splat
Dim NextSplat As Integer


Const ARMED = 0
Const BOOM = 1

Dim KaBoom As Integer

Dim ScoreSlot As Integer

Dim fgifts(1 To MAXGIFTS) As ScoreGFX ' in this case, .loc.x is acceleration downward


Dim streak As Integer

Global guy As userinfo
Dim flive As Integer
Dim CurLevel As level
Dim tcount As Integer
Dim stime As Long
Global ingame As Boolean
Dim frankfurter As Long
Dim soundf As Integer
Dim soundpos As Long
Dim DoneGame As Boolean
Dim last As Long
Dim now As Long
Dim LastFrameUpdate As Long

Dim UpdateFrame As Boolean

Dim SecondsElapsed As Double

Dim WeapNum As Integer
'sounds
Dim InnocentSound As Integer
Dim Yoink As Integer
Dim arming As Integer
Dim bussound As Integer
Dim oceans As Integer

Dim curbusframe As Integer

Dim ScenarioWorth As Integer

Global waiting As Boolean
Global weapon(1 To MAXWEAPS) As gun

Global gun As Integer

Global panner As Integer

Global bozo3 As Integer
Dim bozo5 As Integer
Dim bozo4 As Integer

Dim DeathZone As vect
Dim SpecialWeapon As Byte



Const SW_BUS = 1
Const SW_MINE = 2
Const SW_ION = 4
Const SW_PIANO = 8
Const SW_BHOLE = 16

Dim BUSSPRITE As Integer
Dim IonSprite As Integer

Dim IonBlast As StaticSprite
Dim PianoMan As Splat


Dim TheShot As vect
Dim WasShootin

Sub DebugOut(txt As String)
Open App.Path + "\crash.log" For Append As #2
Print #2, txt
Close #2
End Sub
Function RapidGun() As Boolean
If weapon(WeapNum).type = BLASTERRAP Or weapon(WeapNum).type = SNIPERAP Then RapidGun = True Else RapidGun = False
End Function
Sub AddShot(x As Integer, y As Integer)
panner = x
WasShootin = True
TheShot.x = x
TheShot.y = y
End Sub

Sub quitgame()
ingame = False
DoneGame = True
End Sub
Function Hash(tohash As String) As String
Dim x As Integer
For x = 1 To Len(tohash)
   Hash = Hash + Chr$(Asc(Mid$(tohash, x, 1)) + x)
Next x
End Function
Sub loadweaponammo(ammo4wep() As Integer)
Dim x As Integer
For x = 1 To MAXWEAPS
   weapon(x).ammo = ammo4wep(x)
Next
End Sub
Function NewGuy(name As String, pw As String) As String
If name = "" Then NewGuy = "Please enter the username and password you would like to use.": Exit Function
If pw = "" Then NewGuy = "Please enter a password.": Exit Function
On Error Resume Next
Open App.Path + "\" + name + ".guy" For Input As #5
If (Err <> 53) Then
   Close #5
   NewGuy = "That guy already exists."
   Exit Function
End If
Open App.Path + "\" + name + ".guy" For Output As #5
   Write #5, Hash(pw), 0, 0, 0, 0, 0, 0, 0
   Dim x As Integer
   For x = 1 To MAXWEAPS
      Write #5, 0
    Next x
Close #5

NewGuy = "Finished! Press 'Go!' to begin your game."
End Function
Function writeguy()
Dim x As Integer
Open App.Path + "\tmp.guy" For Output As #5
Write #5, Hash(guy.pword), guy.shots, guy.hits, guy.score, guy.longstreak, guy.rank, guy.levelsplayed, guy.scenario
For x = 1 To MAXWEAPS
   Write #5, guy.favweap(x).shots
Next x
x = 0
While guy.KillFairy(x).shotcount > 0
   Write #5, guy.KillFairy(x).name, guy.KillFairy(x).shotcount
   x = x + 1
Wend
Close #5
Kill App.Path + "\" + guy.name + ".guy"
Name App.Path + "\tmp.guy" As App.Path + "\" + guy.name + ".guy"
End Function
Function LoadGuy(name As String, pw As String, Optional dopw As Boolean = True) As String
If pw = "" Or name = "" Then LoadGuy = "Please type your username and password.": Exit Function
If pw = "" Then LoadGuy = "Please enter your password.": Exit Function

On Error GoTo AIEE:
Dim pwhash As String
Open App.Path + "\" + name + ".guy" For Input As #5
Input #5, pwhash

If pwhash <> Hash(pw) And dopw Then
   Close #5
   LoadGuy = "Wrong Password. Please enter the right one."
   Exit Function
End If

guy.name = name
guy.pword = pw
Input #5, guy.shots, guy.hits, guy.score, guy.longstreak, guy.rank, guy.levelsplayed, guy.scenario
Dim x As Integer
For x = 1 To MAXWEAPS
   Input #5, guy.favweap(x).shots
Next x
For x = 0 To DIFFFAIRIES
   guy.KillFairy(x).shotcount = 0
Next x
x = 0
While Not EOF(5)
     Input #5, guy.KillFairy(x).name, guy.KillFairy(x).shotcount
      x = x + 1
Wend
   
Close #5

LoadGuy = "OK"
Exit Function

AIEE:
If Err = 53 Then
   LoadGuy = "User not found! To create a new user, enter the username (id) and password and click the 'New User' button."
   Exit Function
End If
If Err = 55 Then Close #5
 LoadGuy = "Some kind of error occured. This is a bad thing. " + Str$(Err)
End Function
'-=--=-=-=--=-=-=-=-=-=-=-=-=-=-===-=-=-=-=-=-=-=-=-=-=-=-=-==-=-=-=-=--=-=-=-
Function LoadLevel(ByVal name As String) As Integer
Dim x As Integer
Dim blankfairy As fairy
initweather
  
If PlaySounds <> 0 Then
    InnocentSound = RegisterSound("dumbass.wav")
    Yoink = RegisterSound("yoink.wav")
    bozo5 = RegisterSound("switch.wav")
    arming = RegisterSound("arm.wav")
    bussound = RegisterSound("bus.wav")
End If


With CurLevel
   .bgpic = ""
   .fguys = 0
   .ambient = 0
   For x = 1 To MAXFTYPES
      .ftypes(x) = blankfairy
      .numof(x) = 0
   Next x
   .shots = 0
   .hits = 0
   .kills = 0
   .name = ""
   .next = ""
   .numfairies = 0
   .next = "end"
   .timelimit = 0
   .drawfg = False
End With
   
Dim temp$: temp$ = ""
x = 1
Dim ctemp As level

ctemp.drawfg = False


Open DATAFILE For Input As #1
Line Input #1, temp$
While (getkey(temp$) <> "levels") And Not (EOF(1))
   Line Input #1, temp$
Wend
If EOF(1) Then Exit Function

Line Input #1, temp$
While getkey(temp$) <> "/levels"
   If getkey(temp$) = name Then
      Line Input #1, temp$
      While getkey(temp$) <> "/" + name
          With ctemp
             Select Case getitemkey(temp$)
                Case Is = "bgpic"
                   .bgpic = getitem(temp$)
                Case Is = "timelimit"
                   .timelimit = Val(getitem(temp$))
                Case Is = "fground"
                   .fground = getitem(temp$)
                   .drawfg = True
                Case Is = "sngname"
                   .sngname = getitem(temp$)
                Case Is = "ambient"
                   If (PlayAmbience <> 0) And (PlaySounds <> 0) Then .ambient = RegisterSound(getitem(temp$))
                Case Is = "weather"
                   If (WeatherStuff <> 0) Then .weather = getitem(temp$)
                Case Is = "name"
                   .name = getitem(temp$)
                Case Is = "next"
                   .next = getitem(temp$)
                Case Else
                   If getitemkey(temp$) <> "" Then
                      .ftypes(x).id = getitemkey(temp$)
                      .numof(x) = Val(getitem(temp$))
                      x = x + 1
                   End If
             End Select
          End With
      Line Input #1, temp$
      Wend
   End If
Line Input #1, temp$
Wend
Close #1

Dim found As Boolean
Dim y As Integer
'Dim a As Integer
Dim temp2$

ctemp.fguys = x - 1

For y = 1 To (ctemp.fguys)
   Open DATAFILE For Input As #1
   Line Input #1, temp$
   While getkey(temp$) <> ctemp.ftypes(y).id And Not (EOF(1))
      Line Input #1, temp$
   Wend
   If Not (EOF(1)) Then
   Dim vframes As Integer
   ctemp.ftypes(y).fcount = 8
    While getkey(temp$) <> "/" + ctemp.ftypes(y).id And Not EOF(1)
          With ctemp.ftypes(y)
             Select Case getitemkey(temp$)
                Case Is = "worth"
                   .worth = Val(getitem(temp$))
                Case Is = "fcount"
                   .fcount = Val(getitem(temp$))
                Case Is = "apic"
                   .apic = RegisterSprite(getitem(temp$), 8, 1)
                Case Is = "asound"
                    If (PlaySounds <> 0) Then .asound = RegisterSound(getitem(temp$))
                Case Is = "rprob"
                   .rprob = Val(getitem(temp$))
                Case Is = "gift"
                   .gift = Val(getitem(temp$))
                Case Is = "intel"
                   .intel = getitem(temp$)
                Case Is = "fpic"
                    If .class = 1 Then vframes = 2 Else vframes = 1
                   .pic = RegisterSprite(getitem(temp$), .fcount, vframes)
                   .size = GetSpriteSize(.pic)
                 Case Is = "fdie1"
                   If (PlaySounds <> 0) Then .fdie1 = RegisterSound(getitem(temp$))
                  Case Is = "fdie2"
                   If (PlaySounds <> 0) Then .fdie2 = RegisterSound(getitem(temp$))
                 Case Is = "dpic"
                    If .class = 1 Then vframes = 2 Else vframes = 1
                   .dpic = RegisterSprite(getitem(temp$), .fcount, vframes)
                 Case Is = "class"
                   .class = getitem(temp$)
                 Case Is = "hp"
                   .maxhp = Val(getitem(temp$))
                Case Is = "name"
                   .name = getitem(temp$)
                Case Is = "speed"
                   .speed = Val(getitem(temp$))
                   
             End Select
           End With
      Line Input #1, temp$
      Wend
      If ctemp.ftypes(y).class = WALKER Or ctemp.ftypes(y).class = FLYER Then
         makeinnocent (ctemp.ftypes(y).pic)
         makeinnocent (ctemp.ftypes(y).dpic)
      End If
    Else
       ctemp.fguys = ctemp.fguys - 1
    End If
Close #1
 Next y
'
  With weapon(1)
     .name = "Pistol"
     .type = SNIPE
     If (PlaySounds <> 0) Then .Sound = RegisterSound("44mag.wav")
     .sprite = RegisterSprite("gun.bmp", 1, 1)
     .delay = 10
     .power = 1
  End With
  With weapon(2)
     .name = "Shotgun"
     .type = BLASTER
     If (PlaySounds <> 0) Then .Sound = RegisterSound("gun2.wav")
     .BLAST = 70
     .sprite = RegisterSprite("shotgun.bmp", 1, 1)
     .delay = 1500
     .power = 3
  End With
  With weapon(4)
     .name = "Howitzer"
     .type = BLASTERRAP
     If (PlaySounds <> 0) Then .Sound = RegisterSound("howie.wav")
     .BLAST = 100
     .sprite = RegisterSprite("howitz.bmp", 1, 1)
     .delay = 100
     .power = 3
 End With
 With weapon(3)
     .name = "Machine Gun"
     .type = SNIPERAP
     If (PlaySounds <> 0) Then .Sound = RegisterSound("mgun.wav")
     .sprite = RegisterSprite("mgun.bmp", 1, 1)
     .delay = 10
     .power = 2
 End With
 With weapon(5)
     .name = "Fairy Mines"
     .type = FMINE
     .sprite = RegisterSprite("fmine1.bmp", 1, 1)
     .power = 5
 End With
 With weapon(6)
     .name = "Death Bus"
     .type = DABUS
     .delay = 2000
     .sprite = RegisterSprite("buscon.bmp", 1, 1)
     .power = 10
     If (PlaySounds <> 0) Then .Sound = RegisterSound("mgun.wav")
End With
 With weapon(7)
    .name = "Ion o' Death"
    .type = ION
    .delay = 3000
    .sprite = RegisterSprite("ioncon.bmp", 1, 1)
    .power = 99
End With
 With weapon(8)
    .name = "Piano Man"
    .type = PIANO
    .delay = 1
    .sprite = RegisterSprite("pianocon.bmp", 1, 1)
    .power = 25
End With
 With weapon(9)
    .name = "Black Hole"
    .type = HOLE
    .delay = 1
    .sprite = RegisterSprite("holewep.bmp", 1, 1)
    .power = 1
End With
'HI!
If ctemp.drawfg Then loadfground ctemp.fground
LoadBGround ctemp.bgpic
CurLevel = ctemp
If CurLevel.weather = "rain" Then sndPlaySound raindropskeepfallingonmyhead
 If CurLevel.bgpic = "beach.bmp" Then
    oceans = RegisterSound("ocean.wav", True)
    sndPlaySound oceans
 End If
End Function
Sub userstats()
With guy
    .score = .score + pstats.score
    .shots = .shots + CurLevel.shots
    .hits = .hits + CurLevel.hits
    .levelsplayed = .levelsplayed + 1
End With

End Sub
Function getkey(l As String) As String

Dim temp$
temp$ = Right$(l, Len(l) - InStr(1, l, "<"))

temp$ = (Left$(temp$, Abs(InStr(1, temp$, ">") - 1)))
getkey = temp$
End Function
Function getitemkey(l As String) As String
getitemkey = (Left$(l, Abs(InStr(1, l, "=") - 1)))
End Function
Function getitem(l As String) As String
getitem = (Right$(l, Len(l) - InStr(1, l, "=")))
End Function
Sub endgame()
ingame = False
End Sub
Sub switchgun(newgun As Integer)
If weapon(newgun).ammo = 0 Then Exit Sub
WeapNum = newgun
sndPlaySound bozo5
End Sub

Sub Shot(x As Integer, y As Integer)

WasShootin = False   ' clear variable
panner = x

If ingame = False Then Exit Sub ' should never happen but oh well

If weapon(WeapNum).ammo = 0 Then Exit Sub

If GetTickCount() - weapon(WeapNum).last < weapon(WeapNum).delay Then Exit Sub

guy.favweap(WeapNum).shots = guy.favweap(WeapNum).shots + 1
pstats.shots = pstats.shots + 1
CurLevel.shots = CurLevel.shots + 1

If WeapNum <> 1 Then weapon(WeapNum).ammo = weapon(WeapNum).ammo - 1
weapon(WeapNum).last = GetTickCount()

If weapon(WeapNum).type = DABUS Then
     If (SpecialWeapon And SW_BUS) = 0 Then FireBus
     Exit Sub
End If

If weapon(WeapNum).type = FMINE Then
   FireMine x, y
    Exit Sub
End If

If weapon(WeapNum).type = ION Then
    If (SpecialWeapon And SW_ION) = 0 Then FireIon (x)
    Exit Sub
End If

 
If weapon(WeapNum).type = PIANO Then
   If (SpecialWeapon And SW_PIANO) = 0 Then FirePiano (x)
   Exit Sub
End If

If weapon(WeapNum).type = HOLE Then
   FireHole x, y
   Exit Sub
End If




CheckGiftHit x, y


Dim oldstreak As Integer
oldstreak = streak

If PlaySounds Then sndPlaySound weapon(WeapNum).Sound, x




Dim z As Integer
For z = 0 To MAXFAIRIES
  If flist(z).stat = ALIVE Or flist(z).stat = ACTING Then
  If weapon(WeapNum).type Mod 2 = 0 Then
     If ((x > flist(z).loc.x) And (x - flist(z).loc.x) < flist(z).size) And (y > flist(z).loc.y) And (y - flist(z).loc.y) < flist(z).size Then
        If CheckForHit(x - flist(z).loc.x, y - flist(z).loc.y, flist(z).pic, flist(z).frame) Then
           KillFairy z, weapon(WeapNum).power
           
        End If
      End If
  ElseIf Sqr((x - (flist(z).loc.x + 0.5 * flist(z).size)) ^ 2 + (y - (flist(z).loc.y + 0.5 * flist(z).size)) ^ 2) < weapon(WeapNum).BLAST Then
     
           
           Dim xx As Integer, yy As Integer
           xx = (x - (flist(z).loc.x + 0.5 * flist(z).size))
           yy = (y - (flist(z).loc.y + 0.5 * flist(z).size))
           xx = (Sgn(xx) * weapon(WeapNum).BLAST - xx) * 3
           yy = (Sgn(yy) * weapon(WeapNum).BLAST - yy) * 3
           flist(z).move.x = flist(z).move.x - xx
           flist(z).move.y = flist(z).move.y - yy
           
           
           streak = streak + 1
           
           KillFairy (z), weapon(WeapNum).power
           
  End If
  End If
Next z
If streak = oldstreak Then streak = 0
If guy.longstreak < streak Then guy.longstreak = streak
doranking

End Sub
Sub KillFairy(z As Integer, power As Integer) 'AKA HurtFairy, InjureFairy, etc...
 
 AddSplats Int(flist(z).loc.x + GetSpriteWidth(flist(z).drawpic) / 2), Int(flist(z).loc.y + GetSpriteSize(flist(z).drawpic) / 2), power
 
 pstats.hits = pstats.hits + 1
 pstats.damagedone = pstats.damagedone + power
 flist(z).hp = flist(z).hp - power

CurLevel.hits = CurLevel.hits + 1

If flist(z).hp <= 0 Then
        flist(z).stat = DYING
           
           flist(z).move.y = flist(z).move.y + g
           flist(z).drawpic = flist(z).dpic
           flist(z).frame = 0
           
           If flist(z).class = fairy Then
              CurLevel.kills = CurLevel.kills + 1
            Else
               sndPlaySound InnocentSound, panner
          End If
           pstats.score = pstats.score + flist(z).worth
           If Rnd(1) * 2 < 1 Then sndPlaySound flist(z).fdie1, False Else sndPlaySound flist(z).fdie2, panner
         FWasShot flist(z).name
         AddScore Int(flist(z).loc.x) + flist(z).size, Int(flist(z).loc.y), flist(z).worth
         If flist(z).gift <> 0 Then Spawngift flist(z).gift, Int(flist(z).loc.x), Int(flist(z).loc.y)
   End If
End Sub
Sub doranking()
pstats.percent = (pstats.hits / pstats.shots) * 100
Dim q As Integer
q = 100 - pstats.percent
If q <= 0 Then q = 1
pstats.rank = (pstats.damagedone) * pstats.percent

End Sub

Sub FWasShot(name As String)
Dim x As Integer
While guy.KillFairy(x).name <> name And guy.KillFairy(x).shotcount > 0
     x = x + 1
Wend
guy.KillFairy(x).name = name
guy.KillFairy(x).shotcount = guy.KillFairy(x).shotcount + 1
End Sub

Sub InitScores()
With fscores(1)
   .key = 25
   .sdex = RegisterSprite("25.bmp", 8, 1)
   .height = GetSpriteSize(.sdex)
   .width = GetSpriteWidth(.sdex)
   .show = False
End With
With fscores(2)
   .key = 50
   .sdex = RegisterSprite("50.bmp", 8, 1)
   .height = GetSpriteSize(.sdex)
   .width = GetSpriteWidth(.sdex)
   .show = False
End With
With fscores(3)
   .key = 100
   .sdex = RegisterSprite("100.bmp", 8, 1)
   .height = GetSpriteSize(.sdex)
   .width = GetSpriteWidth(.sdex)
   .show = False
End With
With fscores(4)
   .key = 200
   .sdex = RegisterSprite("200.bmp", 8, 1)
   .height = GetSpriteSize(.sdex)
   .width = GetSpriteWidth(.sdex)
   .show = False
End With
With fscores(5)
   .key = 500
   .sdex = RegisterSprite("500.bmp", 8, 1)
   .height = GetSpriteSize(.sdex)
   .width = GetSpriteWidth(.sdex)
   .show = False
End With
With fscores(6)
   .key = 1000
   .sdex = RegisterSprite("1000.bmp", 8, 1)
   .height = GetSpriteSize(.sdex)
   .width = GetSpriteWidth(.sdex)
   .show = False
End With
With fscores(7)
   .key = -1
   .sdex = RegisterSprite("0.bmp", 8, 1)
   .height = GetSpriteSize(.sdex)
   .width = GetSpriteWidth(.sdex)
   .show = False
End With
ScoreSlot = 0

Dim q As Integer
For q = 0 To MAXSCORESONSCREEN - 1
   ShowScores(q).show = False 'initialize score so none are showing
Next q

End Sub

Sub InitSplats()
Dim x As Integer
For x = 0 To MAXSPLATS - 1
   If 0 = x Mod 4 Then
        FSplats(x).sdex = RegisterSprite("splat.bmp", 4, 1)
    Else
        FSplats(x).sdex = RegisterSprite("gore.bmp", 16, 1)
    End If
   FSplats(x).show = False
Next x
End Sub
Sub AddSplat(x As Integer, y As Integer)
Dim q As Integer
q = NextSplat

NextSplat = (NextSplat + 1) Mod MAXSPLATS

With FSplats(q)
   .show = True
   .loc.x = x
   .loc.y = y
   .vel.x = ((Rnd(1) * 10) - 5)  ' speed in x direction
   .vel.y = -((Rnd(1) * 20) + 5) ' speed in y direction
   .frame = Int(Rnd(1) * GetSpriteFramesX(.sdex))
End With
End Sub

Sub AddSplats(x As Integer, y As Integer, power As Integer)
    Dim xi As Integer
    For xi = 0 To power
        AddSplat x, y
    Next xi
End Sub
Sub dosplats()
Dim q As Integer
For q = 0 To MAXSPLATS - 1
   If FSplats(q).show Then
      putpic Int(FSplats(q).loc.x), Int(FSplats(q).loc.y), FSplats(q).sdex, FSplats(q).frame
      FSplats(q).loc.x = FSplats(q).loc.x + FSplats(q).vel.x
      FSplats(q).loc.y = FSplats(q).loc.y + FSplats(q).vel.y
      FSplats(q).vel.y = FSplats(q).vel.y + (SecondsElapsed * GRAVITY)
      If FSplats(q).loc.y > ScreenHeight Then
        If FSplats(q).vel.y < 10 Then FSplats(q).show = False Else FSplats(q).vel.y = (-0.3) * FSplats(q).vel.y
    End If
    End If
Next q
End Sub
Sub InitMines()
Dim q As Integer
For q = 1 To MAXMINES
   fmines(q).show = False
Next q
Exit Sub
End Sub

Sub InitHoles()
Dim q As Integer
For q = 1 To MAXMINES
   FHoles(q).show = False
Next q
Exit Sub
End Sub
Sub FireHole(x As Integer, y As Integer)
SpecialWeapon = SpecialWeapon Or SW_BHOLE

Dim q As Integer
For q = 1 To MAXMINES
   If FHoles(q).show = False Then GoTo HellAndBack
Next q
Exit Sub

HellAndBack:

With FHoles(q)
   .sdex = RegisterSprite("bhole.bmp", 4, 1)
   .loc.x = x - (GetSpriteWidth(.sdex) / 2)
   .loc.y = y - (GetSpriteSize(.sdex) / 2)
   If .sdex <> 0 Then .show = True
   .frame = 0
   .key = (Rnd(1) * 5000) + 8000
   .ltime = GetTickCount()
End With

End Sub
Sub FireMine(x As Integer, y As Integer)
If KaBoom = 0 Then KaBoom = RegisterSound("boom.wav")
SpecialWeapon = SpecialWeapon Or SW_MINE
Dim q As Integer
For q = 1 To MAXMINES
   If fmines(q).show = False Then GoTo hell
Next q
Exit Sub

hell:
   fmines(q).sdex = RegisterSprite("fmine.bmp", 8, 1)
   fmines(q).loc.x = x - (GetSpriteSize(fmines(q).sdex) / 2)
   fmines(q).loc.y = y - (GetSpriteSize(fmines(q).sdex) / 2)
   If fmines(q).sdex <> 0 Then fmines(q).show = True
   fmines(q).frame = 0
   fmines(q).key = ARMED
   sndPlaySound arming, x
   
End Sub
Sub DoHoles()
Dim stillthere As Boolean
stillthere = False
Dim x As Integer
For x = 1 To MAXMINES
With FHoles(x)
   If .show = True Then
      If GetTickCount - .ltime > .key Then .show = False Else stillthere = True
      If UpdateFrame Then .frame = (.frame + 1) Mod 8
      If .show And .sdex > 0 Then
         putpic Int(.loc.x), Int(.loc.y), .sdex, Int(.frame / 2)
      End If
   End If
End With
Next x
If Not (stillthere) Then SpecialWeapon = SpecialWeapon And Not SW_BHOLE
      
   
End Sub
Sub DoMines()
Dim stillthere As Boolean
stillthere = False
Dim x As Integer
For x = 1 To MAXMINES
   If (fmines(x).show = True) Then
      If fmines(x).key = BOOM And fmines(x).frame = 7 Then fmines(x).show = False Else stillthere = True
      fmines(x).frame = (fmines(x).frame + 1) Mod 8
      If (fmines(x).show) And (fmines(x).sdex > 0) Then
         putpic Int(fmines(x).loc.x), Int(fmines(x).loc.y), fmines(x).sdex, fmines(x).frame
         
      End If
    End If
Next x
If Not (stillthere) Then SpecialWeapon = SpecialWeapon And Not SW_MINE
End Sub
Sub FireIon(x As Integer)
SpecialWeapon = SpecialWeapon Or SW_ION
IonBlast.sdex = RegisterSprite("ion.bmp", 9, 1)
IonBlast.loc.x = x
IonBlast.loc.y = SCREENTOP
IonBlast.frame = 0
sndPlaySound RegisterSound("ionzap.wav"), x


End Sub
Sub DoIon()

Dim drawframe As Integer

If IonBlast.frame < 9 Then
   drawframe = IonBlast.frame
Else
   If IonBlast.frame < 25 Then
       drawframe = 7 + IonBlast.frame Mod 2
   Else
      If IonBlast.frame < 33 Then
         drawframe = 33 - IonBlast.frame
      Else
         SpecialWeapon = SpecialWeapon And Not SW_ION
      End If
   End If
End If
        
putpic Int(IonBlast.loc.x), Int(IonBlast.loc.y), IonBlast.sdex, drawframe
IonBlast.frame = (IonBlast.frame + 1)
      
    
   


End Sub
Sub FirePiano(x As Integer)
SpecialWeapon = SpecialWeapon Or SW_PIANO
PianoMan.sdex = RegisterSprite("piano.bmp", 2, 1)
PianoMan.loc.x = x
PianoMan.loc.y = SCREENTOP - GetSpriteSize(PianoMan.sdex)
PianoMan.vel.y = 50
PianoMan.frame = 0
PianoMan.show = True
sndPlaySound RegisterSound("pfall.wav"), x
End Sub
Sub DoPiano()
If PianoMan.show Then
    putpic Int(PianoMan.loc.x), Int(PianoMan.loc.y), PianoMan.sdex, PianoMan.frame
    PianoMan.loc.y = PianoMan.loc.y + PianoMan.vel.y
    PianoMan.vel.y = PianoMan.vel.y + (SecondsElapsed * GRAVITY)
    PianoMan.frame = (PianoMan.frame + 1) Mod 2
    If PianoMan.loc.y + GetSpriteSize(PianoMan.sdex) >= ScreenHeight Then
       PianoMan.sdex = RegisterSprite("p1d1.bmp", 4, 1)
       PianoMan.frame = 0
       PianoMan.loc.y = ScreenHeight - GetSpriteSize(PianoMan.sdex)
       PianoMan.show = False
       
       AddSplats PianoMan.loc.x + GetSpriteWidth(PianoMan.sdex) / 2, ScreenHeight - 10, 35
       
    End If
Else
    putpic Int(PianoMan.loc.x), Int(PianoMan.loc.y), PianoMan.sdex, PianoMan.frame
    PianoMan.frame = (PianoMan.frame + 1) ' Mod 4
    If PianoMan.frame >= 4 Then
    sndPlaySound RegisterSound("pianobang.wav"), panner
       SpecialWeapon = SpecialWeapon And Not SW_PIANO
    End If
End If
   
End Sub
Sub FireBus()
sndPlaySound bussound
SpecialWeapon = SpecialWeapon Or SW_BUS
BUSSPRITE = RegisterSprite("busanim.bmp", 2, 1)
'MakeBus (BUSSPRITE)
curbusframe = 0
With DeathZone
   .x = -(GetSpriteWidth(BUSSPRITE))
   .y = ScreenHeight - GetSpriteSize(BUSSPRITE)
End With
End Sub
Sub DoBus()
curbusframe = (curbusframe + 1) Mod BUSFRAMES
putpic Int(DeathZone.x), Int(DeathZone.y), BUSSPRITE, curbusframe
DeathZone.x = DeathZone.x + (400 * ((now - last) * 0.001))

If DeathZone.x >= ScreenWidth Then
   BUSSPRITE = 0
   SpecialWeapon = SpecialWeapon And Not SW_BUS
End If
End Sub
Sub AddScore(x As Integer, y As Integer, key As Integer)

Dim q As Integer
q = 1
If key < 0 Then key = -1
While q <= MAXSCOREGFX
   If fscores(q).key = key Then GoTo thisischeap:
   q = q + 1
Wend
Exit Sub

thisischeap:
With ShowScores(ScoreSlot)
   .width = fscores(q).height
   .height = fscores(q).height
   .loc.x = x
   If x + .width > ScreenWidth Then .loc.x = ScreenWidth - .width
   .loc.y = y
   If y + .height > ScreenHeight Then .loc.y = ScreenHeight - .height
   .sdex = fscores(q).sdex
   '.stime = GetTickCount
   .show = True
   .frame = 0
   .spawntime = now
End With
ScoreSlot = (ScoreSlot + 1) Mod MAXSCORESONSCREEN
End Sub
Sub DrawScores()
Dim q As Integer, a As Integer
For q = 0 To MAXSCORESONSCREEN - 1
   With ShowScores(q)
      If .show Then
    
        If (now - .spawntime < 1000) Then a = 0 Else a = (now - .spawntime - 1000) / 100
                
        If a > 7 Then .show = False Else putpic Int(.loc.x), Int(.loc.y), .sdex, a
      End If
    End With
Next q
End Sub

Sub InitFairies()
Dim x As Integer, y As Integer


For x = 0 To MAXFAIRIES
   flist(x).stat = DEAD
Next x


 Dim numf As Integer
flive = 0
numf = 0
For x = 1 To CurLevel.fguys

For y = 1 To CurLevel.numof(x)
   
   With flist(numf)
      .gift = CurLevel.ftypes(x).gift
      .loc.x = ((ScreenWidth - SpriteSize) * Rnd(1)) + 1
      .loc.y = ((ScreenHeight - SpriteSize - SCREENTOP) * Rnd(1)) + 1 + SCREENTOP
      .speed = CurLevel.ftypes(x).speed
      .class = CurLevel.ftypes(x).class
      .maxhp = CurLevel.ftypes(x).maxhp
      .hp = .maxhp
      If .class = fairy Then flive = flive + 1
      .pic = CurLevel.ftypes(x).pic
      .size = GetSpriteSize(.pic)
      .name = CurLevel.ftypes(x).name
      Select Case .class
         Case Is = fairy
             .loc.y = ((ScreenHeight - SpriteSize - SCREENTOP) * Rnd(1)) + 1 + SCREENTOP
             .move.x = ((.speed * Rnd(1)) + 1) - (.speed / 2)
             .move.y = ((.speed * Rnd(1)) + 1) - (.speed / 2)
         Case Is = WALKER
             .move.x = .speed
             .move.y = 0
             .loc.y = ScreenHeight - .size
         Case Is = SITTER
             .move.x = 0
             .move.y = 0
             .loc.y = (Rnd(1) * (ScreenHeight - .size))
             .loc.x = 0
             .speed = 100
         Case Is = FLYER
             .loc.y = ((ScreenHeight - SpriteSize - SCREENTOP) * Rnd(1)) + 1 + SCREENTOP
             .move.x = .speed
             .move.y = 0
             
      End Select
      
      .worth = CurLevel.ftypes(x).worth
      .dpic = CurLevel.ftypes(x).dpic
      .stat = ALIVE
      
      .fcount = CurLevel.ftypes(x).fcount
      .frame = Int(Rnd(1) * .fcount)
      .ltime = GetTickCount()
      .apic = CurLevel.ftypes(x).apic
      .asound = CurLevel.ftypes(x).asound
      .rprob = CurLevel.ftypes(x).rprob
      .intel = CurLevel.ftypes(x).intel
      .fdie1 = CurLevel.ftypes(x).fdie1
      .fdie2 = CurLevel.ftypes(x).fdie2
      .drawpic = .pic
    End With
    numf = numf + 1
Next y
Next x

WasShootin = False
End Sub
Sub turn(guy As fairy)

With guy
      .move.x = ((.speed * Rnd(1)) + 1) - (.speed / 2)
      .move.y = ((.speed * Rnd(1)) + 1) - (.speed / 2)
End With

End Sub

Sub LookOutForThePiano(x As Integer)

If flist(x).stat <> DYING And Abs(flist(x).loc.x + flist(x).size / 2 - (PianoMan.loc.x + GetSpriteWidth(PianoMan.sdex) / 2)) < GetSpriteWidth(PianoMan.sdex) / 2 And Abs(flist(x).loc.y + flist(x).size / 2 - (PianoMan.loc.y + GetSpriteSize(PianoMan.sdex) / 2)) < GetSpriteSize(PianoMan.sdex) / 2 Then
   KillFairy (x), 25
   sndPlaySound RegisterSound("pianobang.wav"), x
End If
End Sub
Sub LookOutForTheIonCannon(fairy As Integer)

If flist(fairy).stat <> DYING And Abs((flist(fairy).loc.x + flist(fairy).size / 2) - (IonBlast.loc.x + GetSpriteWidth(IonBlast.sdex) / 2)) < (flist(fairy).size + GetSpriteWidth(IonBlast.sdex)) / 2 Then
   'flist(fairy).move.x = flist(fairy).move.x + 500 * Sgn(flist(fairy).loc.x - IonBlast.loc.x)
   KillFairy (fairy), 50
End If
End Sub

Sub LookOutForTheBus(fairy As Integer)

If flist(fairy).stat <> DYING And flist(fairy).loc.y + flist(fairy).size > DeathZone.y And flist(fairy).loc.x > DeathZone.x And flist(fairy).loc.x - DeathZone.x < GetSpriteWidth(BUSSPRITE) Then
   flist(fairy).move.x = flist(fairy).move.x + 450
   flist(fairy).move.y = flist(fairy).move.y - 450
   sndPlaySound RegisterSound("SPLAT!.wav"), Int(flist(fairy).loc.x)
   
   KillFairy (fairy), 50
End If

End Sub

Sub LookOutForTheSingularity(fairy As Integer)

Dim p As Integer
For p = 1 To MAXMINES
   If FHoles(p).show And flist(fairy).stat <> DEAD And flist(fairy).stat <> DYING Then
       Dim distx As Integer, disty As Integer, dist As Double
       
       distx = (flist(fairy).loc.x + (GetSpriteWidth(flist(fairy).drawpic)) / 2) - (FHoles(p).loc.x + (GetSpriteWidth(FHoles(p).sdex) / 2))
       disty = (flist(fairy).loc.y + (GetSpriteSize(flist(fairy).drawpic)) / 2) - (FHoles(p).loc.y + (GetSpriteSize(FHoles(p).sdex) / 2))
       dist = Sqr(distx ^ 2 + disty ^ 2)
       distx = distx + Sgn(distx) * dist
       disty = disty + Sgn(disty) * dist
       If Abs(distx) < 20 Then distx = Sgn(distx) * 20
       If Abs(disty) < 20 Then disty = Sgn(disty) * 20
       
       If distx <> 0 Then
           flist(fairy).move.x = flist(fairy).move.x - (9000 / (distx))
       End If
       If disty <> 0 Then
          flist(fairy).move.y = flist(fairy).move.y - (9000 / (disty))
       End If
       
       If Abs(distx) < 50 And Abs(disty) < 50 Then KillFairy fairy, 5
    End If
Next p

End Sub

Sub LookOutForTheMines(fairy As Integer)

Dim p As Integer
For p = 1 To MAXMINES
   If fmines(p).show = True And fmines(p).key = ARMED And flist(fairy).stat = ALIVE Then
      If Sqr((fmines(p).loc.x + 0.5 * GetSpriteSize(fmines(p).sdex) - (flist(fairy).loc.x + 0.5 * flist(fairy).size)) ^ 2 + ((fmines(p).loc.y + 0.5 * GetSpriteSize(fmines(p).sdex)) - (flist(fairy).loc.y + 0.5 * flist(fairy).size)) ^ 2) < (flist(fairy).size + GetSpriteSize(fmines(p).sdex)) / 2 Then
         BlowUpMine (p)
      End If
   End If
Next p

End Sub

Sub BlowUpMine(p As Integer)
 Dim z As Single
Dim q As Integer
  sndPlaySound KaBoom, Int(fmines(p).loc.x)
         fmines(p).key = BOOM
         fmines(p).frame = 0
         fmines(p).sdex = RegisterSprite("fmined1.bmp", 8, 1)
         For q = 0 To MAXFAIRIES
           If flist(q).stat <> DEAD Then
              z = Sqr((fmines(p).loc.x + 0.5 * GetSpriteSize(fmines(p).sdex) - (flist(q).loc.x + 0.5 * flist(q).size)) ^ 2 + ((fmines(p).loc.y + 0.5 * GetSpriteSize(fmines(p).sdex)) - (flist(q).loc.y + 0.5 * flist(q).size)) ^ 2)
              If z < 500 Then
                 Dim xx As Integer, yy As Integer
                 xx = ((fmines(p).loc.x + 0.5 * GetSpriteSize(fmines(p).sdex)) - (flist(q).loc.x + 0.5 * flist(q).size))
                 yy = ((fmines(p).loc.y + 0.5 * GetSpriteSize(fmines(p).sdex)) - (flist(q).loc.y + 0.5 * flist(q).size))
                 xx = (Sgn(xx) * 500 - xx) * 3
                 yy = (Sgn(yy) * 500 - yy) * 3
                 flist(q).move.x = flist(q).move.x - xx
                 flist(q).move.y = flist(q).move.y - yy
                 If flist(q).stat = ALIVE And z < 300 Then KillFairy (q), 25
              End If
           End If
         Next q
         For q = 1 To MAXMINES
            If fmines(q).show = True And fmines(q).key = ARMED Then
              If Sqr((fmines(p).loc.x + 0.5 * GetSpriteSize(fmines(p).sdex) - (fmines(q).loc.x + 0.5 * GetSpriteSize(fmines(q).sdex))) ^ 2 + ((fmines(p).loc.y + 0.5 * GetSpriteSize(fmines(p).sdex)) - (fmines(q).loc.y + 0.5 * GetSpriteSize(fmines(q).sdex))) ^ 2) < 500 Then
                BlowUpMine (q)
              End If
            End If
        Next q
End Sub

Sub UpdateFairies()
Dim x As Integer

If (SpecialWeapon And SW_MINE) <> 0 Then
   For x = 0 To MAXFAIRIES
      If flist(x).stat <> DEAD Then LookOutForTheMines (x)
   Next x
End If


now = GetTickCount()



For x = 0 To MAXFAIRIES
    If flist(x).stat <> DEAD Then
         
        With flist(x)
         
         If Abs(.move.x) > .speed Then .move.x = .move.x * 0.9
         If Abs(.move.y) > .speed Then .move.y = .move.y * 0.9
                 
         If Not (Abs(.move.x) > .speed Or Abs(.move.y) > .speed) Then
           If .stat = ALIVE And (100 * Rnd(1)) + 1 < .intel Then turn flist(x)
        End If

         If (SpecialWeapon And SW_BUS) <> 0 Then LookOutForTheBus (x)
         If (SpecialWeapon And SW_ION) <> 0 Then LookOutForTheIonCannon (x)
         If (SpecialWeapon And SW_PIANO) <> 0 Then LookOutForThePiano (x)
         If (SpecialWeapon And SW_BHOLE) <> 0 Then LookOutForTheSingularity (x)
         
         If .stat = ACTING Then
            If GetTickCount() - .ltime > 1000 Then
               .stat = ALIVE
               .drawpic = .pic
            End If
        ElseIf (.stat = ALIVE And .apic > 0) Then
            If (Rnd(1) * 1000) < .rprob Then
                .stat = ACTING
                .drawpic = .apic
                .frame = 0
                .ltime = GetTickCount()
              '  If .asound > 0 Then sndPlaySound .asound, False
           ' End If
          End If
         End If
        
         
                
            
            ' move the fairy
            .loc.x = .loc.x + SecondsElapsed * .move.x
            .loc.y = .loc.y + SecondsElapsed * .move.y
            If .class <> fairy And .move.x < 0 Then .flip = 1 Else .flip = 0
         
            If .stat = DYING Then
               .move.y = .move.y + g ' fairy accelerates downward
                If .frame = .fcount - 1 Then ' fairy is goner
                    If GameMode = GM_ADVENTURE Then
                       .stat = DEAD
                       If .class = fairy Then flive = flive - 1
                       If flive = 0 Then ingame = False
                    Else
                       .hp = .maxhp
                       .stat = ALIVE
                       .drawpic = .pic
                       .move.y = (Rnd(1) * 1000) + 500
                       .loc.x = Int(Rnd(1) * (ScreenWidth - GetSpriteWidth(.drawpic)))
                       .loc.y = Int(Rnd(1) * (ScreenHeight - .size))
                     End If
                End If
            End If
            
            If UpdateFrame And .fcount <> 0 Then .frame = (.frame + 1) Mod .fcount 'advance frame
            
            ' make sure fairy stays on screen
            If .loc.x + .size > ScreenWidth Then
                .loc.x = ScreenWidth - .size
                .move.x = -(.move.x)
            End If
            If .loc.x < 0 Then
                .loc.x = 0
                .move.x = -(.move.x)
             End If
             If .loc.y < SCREENTOP Then
                 .loc.y = SCREENTOP
                 .move.y = -.move.y
             End If
             If .loc.y + .size > ScreenHeight Then
                .loc.y = ScreenHeight - .size
                .move.y = -(.move.y)
            End If
            
          End With
       End If
    Next
 
End Sub
Sub InitGifts()
Dim x As Integer
For x = 1 To MAXGIFTS
   fgifts(x).show = False
   fgifts(x).sdex = 0
Next x
End Sub
Sub Spawngift(gtype As Integer, x As Integer, y As Integer)
Dim q As Integer
q = 1
While q <= MAXGIFTS
   If fgifts(q).show = False Then GoTo HAHAaGOTOhaha:
   q = q + 1
Wend
Exit Sub
HAHAaGOTOhaha:

With fgifts(q)
.loc.x = x
.loc.y = y
.speed = 0
.show = True
.frame = gtype
Select Case gtype
   Case Is = 1
      .sdex = RegisterSprite("shotammo.bmp", 1, 1)
   Case Is = 2
      .sdex = RegisterSprite("mgun.bmp", 1, 1)
   Case Is = 3
      .sdex = RegisterSprite("howieammo.bmp", 1, 1)
   Case Is = 4
      .sdex = RegisterSprite("mineammo.bmp", 1, 1)
    Case Is = 5
      .sdex = RegisterSprite("busammo.bmp", 1, 1)
End Select
End With
End Sub
Sub DoGifts()
Dim q As Integer
For q = 1 To MAXGIFTS
With fgifts(q)
   If .show Then
      putpic Int(.loc.x), Int(.loc.y), .sdex
      .loc.y = .loc.y + (SecondsElapsed * GIFTSPEED)
     
      If .loc.y + GetSpriteSize(.sdex) > ScreenHeight Then .show = False
      
   End If
End With
Next q
End Sub
Sub CheckGiftHit(x As Integer, y As Integer)
Dim q As Integer
For q = 1 To MAXGIFTS
   With fgifts(q)
      If .show Then
         If x - .loc.x < GetSpriteSize(.sdex) And y - .loc.y < GetSpriteSize(.sdex) Then
             sndPlaySound Yoink, Int(fgifts(q).loc.x)
             Select Case .frame
                Case Is = 1
                    weapon(2).ammo = weapon(2).ammo + 8
                Case Is = 2
                    weapon(3).ammo = weapon(3).ammo + 100
                Case Is = 3
                    weapon(4).ammo = weapon(4).ammo + 25
                Case Is = 4
                    weapon(5).ammo = weapon(5).ammo + 2
                Case Is = 5
                    weapon(6).ammo = weapon(6).ammo + 1
                End Select
             .show = False
         End If
     End If
 End With
Next q

        
         
   
End Sub

Sub DrawFairies()

Static lframetime As Long
Static framecount As Integer

Static lastframecount As Integer

Dim x As Integer
Dim bs As Integer

   PutBG

   For x = 0 To MAXFAIRIES
      If flist(x).stat <> DEAD Then putpic Int(flist(x).loc.x), Int(flist(x).loc.y), flist(x).drawpic, flist(x).frame, flist(x).flip
   Next x
   
   
   
   If (SpecialWeapon And SW_BUS) <> 0 Then DoBus
   If (SpecialWeapon And SW_MINE) <> 0 Then DoMines
   If (SpecialWeapon And SW_ION) <> 0 Then DoIon
   If (SpecialWeapon And SW_PIANO) <> 0 Then DoPiano
   If (SpecialWeapon And SW_BHOLE) <> 0 Then DoHoles
   
   If CurLevel.weather = "snow" Then dosnow
   If CurLevel.weather = "rain" Then dorain SecondsElapsed
   
   putfg CurLevel.drawfg
   DrawScores
   DoGifts
   dosplats
   
   If GetTickCount() - lframetime > 1000 Then
      lframetime = GetTickCount
      lastframecount = framecount
      framecount = 0
   End If
   framecount = framecount + 1
    
   DoText 300, 60, Str$(tcount)
   DoText 70, 60, Str$(pstats.hits)
     
   
   
   Dim diff As Long
   diff = Abs(DScore - pstats.score)
   If diff < 10 Then DScore = pstats.score
   If DScore < pstats.score Then DScore = DScore + 5 * (Int(diff / 50) + 1)
   If DScore > pstats.score Then DScore = DScore - 5 * (Int(diff / 50) + 1)
   DoText 70, 23, Str$(DScore)
   
   
   DoText 0, 0, Str$(lastframecount) + " FPS" ' "Streak: " + Str$(streak) '"Soundpos is" + Str$(soundpos)
   DoText 700, 30, CurLevel.name
   DoText 696, 58, Str$(Int(pstats.rank)) ' + "%"
   
   
   '  textcolor RGB(0, 0, 0), RGB(8, 93, 1)
     DoText 565, 58, Str$(weapon(WeapNum).ammo)
  
   If CurLevel.ambient <> 0 Then
      bs = Int(Rnd(1) * 300 + 1)
      If bs = 11 Then Call sndPlaySound(CurLevel.ambient)
   End If
     putpic 380, 30, weapon(WeapNum).sprite, 0
   
   flip
End Sub
Sub iwonthisstupidgame()
Dim xy As Integer
xy = RegisterSprite("win2.bmp", 1, 1)
putpic (ScreenWidth - GetSpriteWidth(xy)) / 2, (ScreenHeight - GetSpriteSize(xy)) / 2, xy
waiting = True
End Sub
Sub putstuffonthatstatssheet()

'textcolor RGB(86, 68, 16), RGB(8, 93, 1)
DoText 477, 296, Str$(CurLevel.kills)
DoText 477, 329, Str$(CurLevel.timelimit - tcount)
DoText 477, 359, Str$(CurLevel.shots)
If CurLevel.shots > 0 Then DoText 477, 390, Str$(Int(100 * (CurLevel.hits / CurLevel.shots))) + "%"
DoText 403, 490, CurLevel.next

End Sub

Sub gameloop(GFile As String)
  DATAFILE = GFile
  
  InitGame
  'SetupLevel (lname)
  last = GetTickCount
  LastFrameUpdate = last
  
  DebugOut "Starting Game Loop"
  While ingame
    now = GetTickCount
    tcount = CurLevel.timelimit - (GetTickCount() - stime) / 1000
    If tcount <= 0 Then ' out of time!!
        ingame = False
        DoneGame = True
    End If
    
    SecondsElapsed = (now - last) / 1000#
    
    If now - LastFrameUpdate > 35 Then
        UpdateFrame = True
        LastFrameUpdate = now
    Else
        UpdateFrame = False
    End If
    
    If MouseIsDown And RapidGun() Then AddShot Int(MouseLoc.x), Int(MouseLoc.y)
     
    UpdateFairies
     
    If WasShootin Then Shot Int(TheShot.x), Int(TheShot.y)
    
    DrawFairies
    DoEvents
    last = now
    If Not (ingame) And CurLevel.next <> "end" And Not (DoneGame) Then
        ScoreAndWait
        SetupLevel CurLevel.next
    End If
     
  Wend
  DebugOut "Exit Game Loop"
  If Not DoneGame Then          ' you win!!!
     ScoreAndWait
     DScore = pstats.score
     iwonthisstupidgame
     flip
     If guy.scenario < ScenarioWorth Then guy.scenario = ScenarioWorth
          
waitforclick 3, 0
  Else
  Dim cow As Integer
  Dim ds As Integer
   If GameMode = GM_ADVENTURE Then
     userstats
     sndStopSound backsound2
     cow = RegisterSprite("endgame.bmp", 1, 1)
       DScore = pstats.score
       DrawFairies
       putpic (ScreenWidth - 360) / 2, (ScreenHeight - 280) / 2, cow
     ds = RegisterSound("die.wav")
     sndPlaySound ds
     flip
     waitforclick 5, 15
     sndStopSound ds
   Else
     If GameMode = GM_MASSACRE Then
      cow = RegisterSprite("win.bmp", 1, 1)
      putpic (ScreenWidth - 360) / 2, (ScreenHeight - 280) / 2, cow
      flip
      waitforclick 5, 15
     End If
End If
End If
  writeguy

End Sub

Sub waitforclick(delay As Integer, seconds As Integer)
Dim tnow As Long
tnow = GetTickCount
While GetTickCount - tnow < delay * 1000
   DoEvents
Wend
waiting = True

tnow = GetTickCount()

While (waiting And seconds = 0) Or (waiting And GetTickCount - tnow < 1000 * seconds)
    DoEvents
Wend
End Sub

Sub SetupLevel(LevelName As String)
        reset
        
        bozo4 = RegisterSound("win.wav")
        DebugOut "Loading Level: " + LevelName
        LoadLevel LevelName
        InitFairies
        InitScores
        InitGifts
        InitMines
        InitHoles
        InitSplats
        MouseIsDown = False
        ingame = True
        DoneGame = False
        If (PlayMusic <> 0) Then
            backsound2 = RegisterSound(CurLevel.sngname, True)
            sndPlaySound backsound2, 0
        End If
        
        stime = GetTickCount()
        last = stime
        SpecialWeapon = 0
        KaBoom = 0
        BUSSPRITE = 0
End Sub
Function InitGame() As Boolean
 
  With pstats
     .hits = 0
     .rank = 0
     .score = 0
     .shots = 0
  End With
  
  Dim x As Integer
  Dim wammo(MAXWEAPS) As Integer
  For x = 1 To MAXWEAPS
     wammo(x) = 0
  Next x
  
  Dim Buff$, lname$
  
  lname$ = ""
  
  Open DATAFILE For Input As #5
  
  Line Input #5, Buff$
    
  While getkey(Buff$) <> "scenario" And Not EOF(5)
     Line Input #5, Buff$
  Wend
  
  If EOF(5) Then
     Close #5
     InitGame = False
     Exit Function
  End If
  
  Line Input #5, Buff$
  
  While getkey(Buff$) <> "/scenario" And Not EOF(5)
      Select Case getitemkey(Buff$)
         Case Is = "start"
             lname$ = getitem(Buff$)
         Case Is = "worth"
             ScenarioWorth = Val(getitem(Buff$))
         Case Else
             If Left$(Buff$, 6) = "weapon" Then
                wammo(Val(Mid$(Buff$, 7, 1))) = Val(getitem(Buff$))
             End If
        End Select
     Line Input #5, Buff$
  Wend
  
  If EOF(5) Or lname$ = "" Then
     Close #5
     InitGame = False
     Exit Function
  End If
  
  Close #5
  
  Randomize Timer
    
  DScore = 0
  
  loadweaponammo wammo
  InitDSound
  SetupLevel (lname$)
  switchgun (1)
  SpecialWeapon = 0
  
End Function
Sub ScoreAndWait()

 DrawFairies
        PutStats
        userstats
        putstuffonthatstatssheet
        
        If (PlayMusic <> 0) Then sndStopSound backsound2
        
       sndPlaySound bozo4, False
        waiting = True
        flip
       
       waitforclick 5, 0
        sndStopSound bozo4
End Sub
