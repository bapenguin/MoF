VERSION 4.00
Begin VB.Form Form2 
   BackColor       =   &H00000000&
   BorderStyle     =   4  'Fixed ToolWindow
   Caption         =   "Main Menu"
   ClientHeight    =   6225
   ClientLeft      =   2775
   ClientTop       =   1635
   ClientWidth     =   6345
   ControlBox      =   0   'False
   Height          =   6630
   Left            =   2715
   LinkTopic       =   "Form2"
   MaxButton       =   0   'False
   MinButton       =   0   'False
   ScaleHeight     =   415
   ScaleMode       =   3  'Pixel
   ScaleWidth      =   423
   ShowInTaskbar   =   0   'False
   Top             =   1290
   Width           =   6465
   Begin VB.PictureBox Picture2 
      Appearance      =   0  'Flat
      AutoSize        =   -1  'True
      BackColor       =   &H80000005&
      BorderStyle     =   0  'None
      ForeColor       =   &H80000008&
      Height          =   1500
      Left            =   1200
      Picture         =   "mmenu.frx":0000
      ScaleHeight     =   1500
      ScaleWidth      =   4065
      TabIndex        =   5
      Top             =   1440
      Width           =   4065
   End
   Begin VB.PictureBox Picture1 
      Appearance      =   0  'Flat
      AutoSize        =   -1  'True
      BackColor       =   &H80000005&
      ForeColor       =   &H80000008&
      Height          =   930
      Left            =   120
      Picture         =   "mmenu.frx":6E82
      ScaleHeight     =   900
      ScaleWidth      =   6180
      TabIndex        =   0
      Top             =   0
      Width           =   6210
   End
   Begin VB.Label Label5 
      Alignment       =   2  'Center
      BackColor       =   &H00000000&
      BorderStyle     =   1  'Fixed Single
      Caption         =   "High Scores"
      BeginProperty Font 
         name            =   "Times New Roman"
         charset         =   0
         weight          =   700
         size            =   20.25
         underline       =   0   'False
         italic          =   0   'False
         strikethrough   =   0   'False
      EndProperty
      ForeColor       =   &H008080FF&
      Height          =   495
      Left            =   120
      TabIndex        =   7
      Top             =   4920
      Width           =   3015
   End
   Begin AMovieCtl.ActiveMovie vid 
      Height          =   60
      Left            =   3360
      TabIndex        =   6
      Top             =   3840
      Width           =   60
      _ExtentX        =   106
      _ExtentY        =   106
      ShowDisplay     =   0   'False
      ShowControls    =   0   'False
      AutoStart       =   -1  'True
      AutoRewind      =   0   'False
      PlayCount       =   0
      BorderStyle     =   0
   End
   Begin VB.Label Label4 
      Alignment       =   2  'Center
      Appearance      =   0  'Flat
      BackColor       =   &H80000005&
      BackStyle       =   0  'Transparent
      Caption         =   "PRESENTS"
      BeginProperty Font 
         name            =   "MS Sans Serif"
         charset         =   0
         weight          =   400
         size            =   18
         underline       =   0   'False
         italic          =   0   'False
         strikethrough   =   0   'False
      EndProperty
      ForeColor       =   &H00FF0000&
      Height          =   375
      Left            =   1920
      TabIndex        =   4
      Top             =   960
      Width           =   2535
   End
   Begin VB.Label Label3 
      Alignment       =   2  'Center
      BackColor       =   &H00000000&
      BorderStyle     =   1  'Fixed Single
      Caption         =   "QUIT"
      BeginProperty Font 
         name            =   "Times New Roman"
         charset         =   0
         weight          =   700
         size            =   20.25
         underline       =   0   'False
         italic          =   0   'False
         strikethrough   =   0   'False
      EndProperty
      ForeColor       =   &H008080FF&
      Height          =   495
      Left            =   120
      TabIndex        =   3
      Top             =   5520
      Width           =   3015
   End
   Begin VB.Label Label2 
      Alignment       =   2  'Center
      BackColor       =   &H00000000&
      BorderStyle     =   1  'Fixed Single
      Caption         =   "MASSACRE!!"
      BeginProperty Font 
         name            =   "Times New Roman"
         charset         =   0
         weight          =   700
         size            =   20.25
         underline       =   0   'False
         italic          =   0   'False
         strikethrough   =   0   'False
      EndProperty
      ForeColor       =   &H008080FF&
      Height          =   495
      Left            =   120
      TabIndex        =   2
      Top             =   4320
      Width           =   3015
   End
   Begin VB.Label Label1 
      Alignment       =   2  'Center
      BackColor       =   &H00000000&
      BorderStyle     =   1  'Fixed Single
      Caption         =   "NEW GAME"
      BeginProperty Font 
         name            =   "Times New Roman"
         charset         =   0
         weight          =   700
         size            =   20.25
         underline       =   0   'False
         italic          =   0   'False
         strikethrough   =   0   'False
      EndProperty
      ForeColor       =   &H008080FF&
      Height          =   495
      Left            =   120
      TabIndex        =   1
      Top             =   3720
      Width           =   3015
   End
End
Attribute VB_Name = "Form2"
Attribute VB_Creatable = False
Attribute VB_Exposed = False
Private Sub Form_Load()
'MMControl1.DeviceType = "AVIVideo"
'MMControl1.filename = App.Path + "\notok.avi"
'MMControl1.Command = "open"
'MMControl1.Command = "play"
'
vid.filename = App.Path + "/notok.avi"
End Sub

Private Sub Form_MouseMove(Button As Integer, Shift As Integer, x As Single, y As Single)
Label1.ForeColor = &H8080FF
Label2.ForeColor = &H8080FF
Label3.ForeColor = &H8080FF
End Sub


Private Sub Label1_Click()

Unload Form2
Set Form2 = Nothing
gdata.gametype = game
Form1.Show 0

End Sub

Private Sub Label1_MouseMove(Button As Integer, Shift As Integer, x As Single, y As Single)
Label5.ForeColor = &H8080FF
Label2.ForeColor = &H8080FF
Label3.ForeColor = &H8080FF
Label1.ForeColor = &HFF&
End Sub


Private Sub Label2_Click()

Unload Form2
Set Form2 = Nothing
gdata.gametype = massacre
Form1.Show 0

End Sub

Private Sub Label2_MouseMove(Button As Integer, Shift As Integer, x As Single, y As Single)
Label5.ForeColor = &H8080FF

Label1.ForeColor = &H8080FF
'Label2.ForeColor = &H8080FF
Label3.ForeColor = &H8080FF
Label2.ForeColor = &HFF&
End Sub



Private Sub Label3_Click()
Unload Form2

Form4.Show
End Sub

Private Sub Label3_MouseMove(Button As Integer, Shift As Integer, x As Single, y As Single)
Label5.ForeColor = &H8080FF

Label1.ForeColor = &H8080FF
Label2.ForeColor = &H8080FF
'Label3.ForeColor = &H8080FF
Label3.ForeColor = &HFF&
End Sub


Private Sub MMControl1_Done(NotifyCode As Integer)
mmcontrol1.Command = "play"
End Sub


Private Sub mmenu_Click()

End Sub


Private Sub Label5_Click()
Form1.showscores
Form3.Show
End Sub

Private Sub Label5_MouseMove(Button As Integer, Shift As Integer, x As Single, y As Single)
Label5.ForeColor = &HFF&
Label1.ForeColor = &H8080FF
Label2.ForeColor = &H8080FF
Label3.ForeColor = &H8080FF
End Sub


Private Sub Picture2_Click()
coder = InputBox("Type in Video off code:")
If coder = "jimmy" Then
  vid.Visible = False
  End If
End Sub


Private Sub vid_MouseDown(Button As Integer, Shift As Integer, x As Single, y As Single)
MsgBox "Register this program to get rid of this ANNOYING video"
End Sub

