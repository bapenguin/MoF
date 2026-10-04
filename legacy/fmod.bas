Attribute VB_Name = "Gfx"
Option Explicit


'#Const DEBUGMODE = True

Option Compare Text

'Global Const SHOWSPRITE = -1

Global Const INNOCENT = -1
Const BUSSPRITE = -2

Global Const ScreenWidth = 1024!    ' Width for the display mode
Global Const ScreenHeight = 768!   ' Height for the display mode
Global Const SpriteSize = 75!     ' Height and width of the sprite

Global Const numSprites = 60
Global Const numSounds = 40


Const BGPATH = "\bg\"
Const SPRITEPATH = "\sprites\"
Const SOUNDPATH = "\sfx\"
Const FGPATH = "\fg\"

Global backsound1 As Integer, backsound2 As Integer, backsound3 As Integer, backsound4 As Integer

Type drop
   x As Double
   y As Double
   dx As Integer
   dy As Integer
   sway As Integer
End Type

Type sprite
   dds As DirectDrawSurface7
   height As Integer
   width As Integer
   framewidth As Integer
   frameheight As Integer
   fx As Integer
   fy As Integer
   
   init As Boolean
   FileName As String
   class As Integer
End Type

Type Sound
    sndIndex As Integer
    init As Boolean
    FileName As String
End Type


Const BPP = 32  ' bits per pixel of display mode

Global dx7 As New DirectX7
Dim dd As DirectDraw7              ' DirectDraw object

Dim ddsBack As DirectDrawSurface7  ' Back buffer

Dim ddsFront As DirectDrawSurface7
Dim ddsFrontDesc As DDSURFACEDESC2


Dim ddsBackgroundDesc As DDSURFACEDESC2


'Dim fx As DDBLTFX                   ' FX structure
Dim hDC As Long                     ' Win32 device context
Dim DestRect As RECT

Dim Sprites(1 To numSprites) As sprite
Dim Sounds(1 To numSounds) As Sound

Dim thunder As Integer

Dim spriteinit(1 To numSprites) As Boolean


Dim BGround As DirectDrawSurface7  ' Surface to hold background
Dim bar As DirectDrawSurface7 ' stat bar
Dim fg As DirectDrawSurface7 'fore ground
Dim Stats As DirectDrawSurface7
Dim weather1 As DirectDrawSurface7
Dim weather2 As DirectDrawSurface7



Dim rain(500) As drop
Dim snow(500) As drop
Dim dx As Long
Dim dy As Long
Dim dz As Integer
Dim sway As Integer
Global raindropskeepfallingonmyhead As Integer

Dim framer As Integer

Function GetTickCount() As Long
GetTickCount = dx7.TickCount
End Function

Sub LogProgress(msg As String)
ddsFront.DrawText 0, 0, msg, False
DebugOut msg
End Sub
    
Sub initweather()
Dim cunt As Integer
   For cunt = 0 To 500
     dx = Int(Rnd(1) * ScreenWidth) + 1
     dy = Int(Rnd(1) * ScreenWidth) + 1
     rain(cunt).dy = Int(Rnd(5) * 30) + 360
     rain(cunt).dx = Int(Rnd(1) * 15) + 30
     rain(cunt).x = dx
     rain(cunt).y = dy

    Next cunt
   For cunt = 0 To 500
     dx = Int(Rnd(1) * ScreenWidth) + 1
     dy = Int(Rnd(1) * ScreenWidth) + 1
     dz = Int(Rnd(5) * 5) + 5
     sway = Int(Rnd(1) * 5) + 1
     snow(cunt).x = dx
     snow(cunt).y = dy
     'snow(cunt).z = dz
     snow(cunt).sway = sway
    Next cunt
thunder = RegisterSound("thunder.wav")
raindropskeepfallingonmyhead = RegisterSound("rain.wav", True)
End Sub
Sub dorain(SecondsElapsed As Double)
Dim bunt As Integer
Dim dummy As Integer


'If Int(Rnd(1) * 3000) < 10 Then
 'Dim fx As DDBLTFX
  '  With fx
   '     .dwSize = Len(fx)
    '    .dwFillColor = RGB(255, 255, 255)
   ' End With
    'ddsBack.Blt ByVal 0&, Nothing, ByVal 0&, DDBLT_COLORFILL Or DDBLT_WAIT, fx
 '   sndPlaySound thunder, False
   'Exit Sub
'End If
   

For bunt = 0 To 500

    Dim newx As Double, newy As Double
    newy = rain(bunt).y + (SecondsElapsed * rain(bunt).dy)
    newx = rain(bunt).x + (SecondsElapsed * rain(bunt).dx)
    

       ddsBack.SetForeColor RGB(0, 0, 105)
       ddsBack.setDrawWidth 2
       ddsBack.DrawLine rain(bunt).x, rain(bunt).y, newx, newy
       
       rain(bunt).x = newx
       rain(bunt).y = newy
       
       If rain(bunt).y >= ScreenHeight Then rain(bunt).y = 0
       If rain(bunt).x >= ScreenWidth Then rain(bunt).x = 0
     
    Next bunt
'ddsBack.ReleaseDC hDC
End Sub
Function getDx() As DirectX7
Set getDx = dx7
End Function
Sub dosnow()
Dim bunt As Integer
Dim dummy As Integer
Dim dx As Integer, dy As Integer
Static swinger(500) As Integer
Static swingback(500) As Boolean



For bunt = 0 To 350
   
   If swingback(bunt) = False Then swinger(bunt) = swinger(bunt) + 1
   If swingback(bunt) = True Then swinger(bunt) = swinger(bunt) - 1
    
   ' snow(bunt).y = snow(bunt).y + snow(bunt).z
    'If swingback(bunt) = False Then
    snow(bunt).x = snow(bunt).x + swinger(bunt)
    'If swingback(bunt) = True Then snow(bunt).x = snow(bunt).x - swinger(bunt)
       If swinger(bunt) > snow(bunt).sway Then swingback(bunt) = True
       If swinger(bunt) < -(snow(bunt).sway) Then swingback(bunt) = False
     
     If snow(bunt).x >= ScreenWidth Then snow(bunt).x = 0
     If snow(bunt).x < 0 Then snow(bunt).x = ScreenWidth
     If snow(bunt).y > ScreenHeight Then snow(bunt).y = 0
  For dy = -2 To 0
   For dx = 0 To 2
     '  SetPixel hDC, snow(bunt).x + DX, snow(bunt).y + dy, RGB(200, 200, 200)
    Next dx
  Next dy
    Next bunt
'ddsBack.ReleaseDC hDC
End Sub

Sub LoadBGround(fname As String)
LogProgress "Loading BackGround: " + fname + "                       "

Dim ddDesc As DDSURFACEDESC2
ddDesc.ddsCaps.lCaps = DDSCAPS_OFFSCREENPLAIN
ddDesc.lFlags = DDSD_CAPS

Set BGround = dd.CreateSurfaceFromFile(App.Path + BGPATH + fname, ddsBackgroundDesc)

Set bar = dd.CreateSurfaceFromFile(App.Path + SPRITEPATH + "topbar.bmp", ddDesc)
Dim mhddck As DDCOLORKEY

    mhddck.high = 0 'really works only for 24 bit colour
    mhddck.low = 0
    bar.SetColorKey DDCKEY_SRCBLT, mhddck

Dim ddDesc2 As DDSURFACEDESC2
ddDesc2.ddsCaps.lCaps = DDSCAPS_OFFSCREENPLAIN
ddDesc2.lFlags = DDSD_CAPS
Set Stats = dd.CreateSurfaceFromFile(App.Path + SPRITEPATH + "roundinfo.bmp", ddDesc2)
End Sub

Sub makeinnocent(x As Integer)
 If Sprites(x).class <> INNOCENT Then
    Sprites(x).fy = 2
    Sprites(x).frameheight = Sprites(x).frameheight / 2
    Sprites(x).class = INNOCENT
    DebugOut Sprites(x).FileName + "made innocent"
    
End If
End Sub
Sub MakeBus(x As Integer, fx As Integer)
If Sprites(x).class <> BUSSPRITE Then Sprites(x).class = BUSSPRITE
Sprites(x).fx = fx
   
End Sub
Sub loadfground(fname As String)


LogProgress "Loading foreground: " + fname + "                       "


Dim fgDesc As DDSURFACEDESC2
fgDesc.ddsCaps.lCaps = DDSCAPS_OFFSCREENPLAIN
fgDesc.lFlags = DDSD_CAPS
Set fg = dd.CreateSurfaceFromFile(App.Path + FGPATH + fname, fgDesc)
Dim mhddck As DDCOLORKEY

    mhddck.high = 0 'really works only for 24 bit colour
    mhddck.low = 0
    fg.SetColorKey DDCKEY_SRCBLT, mhddck
End Sub
Function GetSpriteSize(Index As Integer) As Integer
GetSpriteSize = Sprites(Index).frameheight
End Function
Function GetSpriteWidth(Index As Integer) As Integer
GetSpriteWidth = Sprites(Index).framewidth
End Function

Function GetSpriteFramesX(Index As Integer) As Integer
GetSpriteFramesX = Sprites(Index).fx
End Function

Sub DoText(x As Long, y As Long, t$)
 ddsBack.SetForeColor (RGB(240, 242, 86))
 ddsBack.DrawText x, y, t$, False
End Sub
Sub putpic(x As Integer, y As Integer, sdex As Integer, Optional framex As Integer = 0, Optional framey As Integer = 0)
   On Error GoTo die
    
   If sdex <= 0 Or sdex > numSprites Then Exit Sub
   If framex < 0 Or framex >= Sprites(sdex).fx Or framey < 0 Or framey >= Sprites(sdex).fy Then Exit Sub
   
    
    Dim t As RECT
       
     t.Top = Sprites(sdex).frameheight * framey
     t.Bottom = t.Top + Sprites(sdex).frameheight
     t.Left = Sprites(sdex).framewidth * framex
     t.Right = t.Left + Sprites(sdex).framewidth
        
     
If x < 0 Then
   t.Left = t.Left - x + 1
   x = 0
End If
If y < 0 Then
   t.Top = t.Top - y + 1
   y = 0
End If
If x + Sprites(sdex).framewidth > ScreenWidth Then
   t.Right = t.Left + (ScreenWidth - x) - 1
End If
If y + Sprites(sdex).frameheight > ScreenHeight Then
   t.Bottom = t.Top + (ScreenHeight - y) - 1
End If

 
If (t.Bottom > t.Top) And (t.Right > t.Left) Then
    Dim dummy As Integer
    dummy = ddsBack.BltFast(x, y, Sprites(sdex).dds, t, DDBLTFAST_SRCCOLORKEY Or DDBLTFAST_WAIT)
End If


 Exit Sub
die:
'Dim d$
'If Sprites(sdex).init Then d$ = "True" Else d$ = "False"
'shutdown'
'
'DebugOut "Error in putpic: Err = " + Str$(Err) + " sdex = " + Str$(sdex) + "  frame = " + Str$(frame) + " sprites(sdex).size)= " + Str$(Sprites(sdex).size) + " x = " + Str$(x) + " y = " + Str$(y) + "  Init? = " + d$ + Chr$(13) + "Filename:  " + Sprites(sdex).FileName + Chr$(13) + "RECT: left: " + Str$(t.Left) + " right: " + Str$(t.Right) + " top: " + Chr$(t.Top) + " bottom: " + Chr$(t.bottom)
'End
End Sub
Function CheckForHit(x As Integer, y As Integer, sdex As Integer, frame As Integer) As Boolean
Dim mhdc As Long
Dim clr As Long
Dim z As Integer

Dim p As RECT
Dim ddsd2 As DDSURFACEDESC2

p.Right = x
p.Top = y
p.Left = x
p.Bottom = y

With Sprites(sdex).dds
    .Lock p, ddsd2, DDLOCK_READONLY, 0
    clr = Sprites(sdex).dds.GetLockedPixel(x, y)
    .Unlock p
End With

   If clr = 0 Then CheckForHit = False Else CheckForHit = True


   
End Function
Sub PutBG()
Dim t As RECT
   With t
      .Top = 0
      .Left = 0
      .Right = 1024
      .Bottom = 768
    End With
ddsBack.BltFast 0, 0, BGround, t, DDBLTFAST_WAIT

End Sub

Function RegisterSprite(fname As String, framesx As Integer, framesy As Integer) As Integer

Dim x As Integer

x = 1
While Sprites(x).init = True
   If (UCase$(Sprites(x).FileName) = UCase$(App.Path + SPRITEPATH + fname)) Then
      RegisterSprite = x
      Exit Function
   End If
   x = x + 1
   
   If (x > numSprites) Then
       RegisterSprite = 0
       Exit Function
    End If
   
Wend


LogProgress "Loading sprite: " + fname + "                       "

If Not (CreateSpriteFromBitmap(App.Path + SPRITEPATH + fname, x, framesx, framesy)) Then
   RegisterSprite = 0
   DebugOut "   REGISTERSPRITE FOR " + fname + " FAILED!"
   Exit Function
End If

RegisterSprite = x

End Function

Function RegisterSound(fname As String, Optional streamer As Boolean) As Integer
Dim x As Integer

x = 1
While (x <= numSounds) And (Sounds(x).init = True)
   If (UCase$(Sounds(x).FileName) = UCase$(fname)) Then
      RegisterSound = x
      Exit Function
   End If
   x = x + 1
Wend

If (x > numSounds) Then
   RegisterSound = 0
   Exit Function
End If

Sounds(x).init = True
Sounds(x).FileName = fname

Sounds(x).sndIndex = General_LoadStaticSound(App.Path + SOUNDPATH + fname, streamer)
RegisterSound = x
End Function
Sub sndPlaySound(sdex As Integer, Optional pan As Integer)
If PlaySounds = 0 Or sdex = 0 Or sdex > numSounds Then Exit Sub
General_PlaySound Sounds(sdex).sndIndex, pan
End Sub
Sub sndStopSound(sdex As Integer)
If sdex = 0 Or sdex > numSounds Then Exit Sub
General_StopSound Sounds(sdex).sndIndex
End Sub
Sub putfg(drawfg As Boolean)
If drawfg Then
Dim t As RECT
  With t
    .Top = 0
    .Left = 0
    .Right = 1024
    .Bottom = 150
   End With
ddsBack.BltFast 0, 618, fg, t, DDBLTFAST_SRCCOLORKEY Or DDBLTFAST_WAIT
End If
Dim p As RECT
  With p
    .Top = 0
    .Left = 0
    .Right = 1024
    .Bottom = 83
  End With
ddsBack.BltFast 0, 0, bar, p, DDBLTFAST_SRCCOLORKEY Or DDBLTFAST_WAIT
End Sub
Sub PutStats()
Dim p As RECT
  With p
    .Top = 0
    .Left = 0
    .Right = 278
    .Bottom = 328
    
  End With
ddsBack.BltFast 373, 220, Stats, p, DDBLTFAST_WAIT
End Sub
Sub flip()
Do
  ddsFront.flip Nothing, DDFLIP_WAIT
  If Err.Number = DDERR_SURFACELOST Then ddsFront.restore
Loop Until Err.Number = 0
End Sub

Private Function CreateSpriteFromBitmap(ByVal strFile As String, sdex As Integer, framesx As Integer, framesy As Integer) As Boolean 'sprite
    On Error Resume Next
    
    Dim ddsd2 As DDSURFACEDESC2
    
    ddsd2.lFlags = DDSD_CAPS
    ddsd2.ddsCaps.lCaps = DDSCAPS_OFFSCREENPLAIN
    
  
    
    Set Sprites(sdex).dds = dd.CreateSurfaceFromFile(strFile, ddsd2)
       
    With Sprites(sdex)
        .dds.GetSurfaceDesc ddsd2
        .fx = framesx
        .fy = framesy
        
        .framewidth = ddsd2.lWidth / .fx
        .frameheight = ddsd2.lHeight / .fy
        
        .init = True
        .FileName = strFile
    End With
    
    ' Create surface
    
    'dd.CreateSurface ddsd, Sprites(sdex).dds, Nothing
    If Err Then DebugOut "***!!!ERROR CREATING SURFACE!!! Er = " + Str$(Err)
    
    DebugOut "***Created surface"
    
    Dim mhddck As DDCOLORKEY

    mhddck.high = 0 'really works only for 24 bit colour
    mhddck.low = 0 'but as sprites have black is all 0 at any rate
    Sprites(sdex).dds.SetColorKey DDCKEY_SRCBLT, mhddck
    ' Returns the new surface
    CreateSpriteFromBitmap = True 'tmpsprite
   
End Function
'''''''''''''''''''''''''''''''''''''''''''''''''''''


Sub init(frm As Form)
    
    'Me = frm
    
    Dim x As Integer
    For x = 1 To numSprites
       Sprites(x).init = False
    Next x
    
    frm.show
    
    ' Create the DirectDraw object
     Set dd = dx7.DirectDrawCreate("")
    
    ' This app is full screen and will change the display mode
    On Error Resume Next
      Call dd.SetCooperativeLevel(frm.hWnd, DDSCL_FULLSCREEN Or DDSCL_ALLOWMODEX Or DDSCL_EXCLUSIVE)
       If Err Then Unload frm: MsgBox "This Game Requires a Video Card capable of 16 Bit Color Display": End
   
    ' Set the display mode (DDERR_DISPLAYMODE if this mode is not supported on your card)
    On Error Resume Next
    DebugOut "Initializing form: " + frm.name
    DebugOut "Trying 16 bpp"
     Call dd.SetDisplayMode(1024, 768, 32, 0, DDSDM_DEFAULT)
      If Err Then DebugOut "Trying 24 bpp":  Call dd.SetDisplayMode(1024, 768, 24, 0, DDSDM_DEFAULT)
         If Err Then DebugOut "Trying 16 bpp":  Call dd.SetDisplayMode(1024, 768, 16, 0, DDSDM_DEFAULT)
            If Err Then DebugOut "Could not find compatable video setting": Unload frm: MsgBox "This Game Requires a Video Card capable of 16/24/32 Bit Color Display at 1024x768": End



    ' Fill front buffer description structure...
    ddsFrontDesc.lFlags = DDSD_CAPS Or DDSD_BACKBUFFERCOUNT
    ddsFrontDesc.ddsCaps.lCaps = DDSCAPS_PRIMARYSURFACE Or DDSCAPS_FLIP Or DDSCAPS_COMPLEX
    ddsFrontDesc.lBackBufferCount = 1
    Set ddsFront = dd.CreateSurface(ddsFrontDesc)
    Dim caps As DDSCAPS2
    caps.lCaps = DDSCAPS_BACKBUFFER
     Set ddsBack = ddsFront.GetAttachedSurface(caps)
    'ddsBack.GetSurfaceDesc ddsBackDesc
    
    ddsBackgroundDesc.lFlags = DDSD_CAPS Or DDSD_WIDTH Or DDSD_HEIGHT
    ddsBackgroundDesc.lWidth = 1024
    ddsBackgroundDesc.lHeight = 768
    ddsBackgroundDesc.ddsCaps.lCaps = DDSCAPS_OFFSCREENPLAIN

    
    ddsFront.SetFontBackColor RGB(0, 0, 0)
    ddsFront.SetForeColor RGB(255, 255, 255)
    ddsFront.SetFontTransparency False
    
    
    
   
End Sub

Sub shutdown()
Dim x As Integer

 ' Clear DirectDraw objects
    Set bar = Nothing
    Set BGround = Nothing
    Set Stats = Nothing
    Set weather1 = Nothing
    Set weather2 = Nothing
    For x = 1 To numSprites
         Set Sprites(x).dds = Nothing
        Sprites(x).init = False
    Next x
    For x = 1 To numSounds
       Sounds(x).init = False
    Next x
    Set fg = Nothing
    dd.FlipToGDISurface
    dd.RestoreDisplayMode
    dd.SetCooperativeLevel 0, DDSCL_NORMAL
  
    Set ddsBack = Nothing
    Set ddsFront = Nothing
    Set dd = Nothing
    Init_UninitializeDirectSound
  
  
     DebugOut "Shutdown Complete..?"
End Sub
Sub reset()
Dim x As Integer

 Set bar = Nothing
 Set Stats = Nothing
 Set BGround = Nothing
  Init_UninitializeDirectSound 'stops all sounds, direct sound doesn't need "uniniting"
    For x = 1 To numSprites
        Set Sprites(x).dds = Nothing
        Sprites(x).init = False
    Next x
DebugOut "Reset"
End Sub

