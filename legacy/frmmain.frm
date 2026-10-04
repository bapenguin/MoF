VERSION 5.00
Begin VB.Form gamemain 
   Appearance      =   0  'Flat
   BackColor       =   &H00C00000&
   BorderStyle     =   0  'None
   ClientHeight    =   9090
   ClientLeft      =   0
   ClientTop       =   0
   ClientWidth     =   11115
   ControlBox      =   0   'False
   BeginProperty Font 
      Name            =   "Garamond"
      Size            =   8.25
      Charset         =   0
      Weight          =   400
      Underline       =   0   'False
      Italic          =   0   'False
      Strikethrough   =   0   'False
   EndProperty
   Icon            =   "frmmain.frx":0000
   KeyPreview      =   -1  'True
   LinkTopic       =   "Form3"
   MaxButton       =   0   'False
   MinButton       =   0   'False
   MouseIcon       =   "frmmain.frx":0BC2
   ScaleHeight     =   606
   ScaleMode       =   3  'Pixel
   ScaleWidth      =   741
   ShowInTaskbar   =   0   'False
   StartUpPosition =   3  'Windows Default
End
Attribute VB_Name = "gamemain"
Attribute VB_GlobalNameSpace = False
Attribute VB_Creatable = False
Attribute VB_PredeclaredId = True
Attribute VB_Exposed = False

Private Sub Form_KeyDown(KeyCode As Integer, Shift As Integer)
If KeyCode = vbKeyQ Then quitgame

If KeyCode = vbKey1 Then switchgun (1)
If KeyCode = vbKey2 Then switchgun (2)
If KeyCode = vbKey3 Then switchgun (3)
If KeyCode = vbKey4 Then switchgun (4)
If KeyCode = vbKey5 Then switchgun (5)
If KeyCode = vbKey6 Then switchgun (6)
If KeyCode = vbKey7 Then switchgun (7)
If KeyCode = vbKey8 Then switchgun (8)
If KeyCode = vbKey9 Then switchgun (9)

If KeyCode = vbKeyF1 Then
   Dim z As Integer
   For z = 1 To MAXWEAPS
      weapon(z).ammo = 1000
Next z
End If

End Sub

Sub BeginGame(GameFile As String)

'Unload Form2
Load Me
init Me


gamemain.MouseIcon = LoadPicture(App.Path + "\cursor.cur")
gamemain.MousePointer = 99

gameloop App.Path + "\" + GameFile

While ingame: Wend
shutdown
   
   'Unload Me
'   Load Form2
End Sub


Private Sub Form_MouseDown(Button As Integer, Shift As Integer, x As Single, y As Single)



If waiting Then waiting = Not waiting
If ingame Then
   AddShot Int(x), Int(y)
   MouseIsDown = True
   MouseLoc.x = x
   MouseLoc.y = y
End If

End Sub

Private Sub Form_MouseMove(Button As Integer, Shift As Integer, x As Single, y As Single)
   MouseLoc.x = x
   MouseLoc.y = y
End Sub

Private Sub Form_MouseUp(Button As Integer, Shift As Integer, x As Single, y As Single)
MouseIsDown = False
End Sub
