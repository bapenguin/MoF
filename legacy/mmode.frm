VERSION 5.00
Begin VB.Form mmode 
   BorderStyle     =   0  'None
   ClientHeight    =   10320
   ClientLeft      =   0
   ClientTop       =   0
   ClientWidth     =   13125
   ClipControls    =   0   'False
   ControlBox      =   0   'False
   LinkTopic       =   "Form3"
   MaxButton       =   0   'False
   MinButton       =   0   'False
   Picture         =   "mmode.frx":0000
   ScaleHeight     =   10320
   ScaleWidth      =   13125
   ShowInTaskbar   =   0   'False
   StartUpPosition =   3  'Windows Default
   Begin VB.CommandButton Command6 
      Caption         =   "Random Massacre"
      Height          =   375
      Left            =   3480
      TabIndex        =   49
      Top             =   9840
      Width           =   1815
   End
   Begin VB.OptionButton weather 
      BackColor       =   &H00004080&
      Caption         =   "Snow"
      Height          =   255
      Index           =   2
      Left            =   10200
      TabIndex        =   47
      Top             =   9240
      Width           =   1215
   End
   Begin VB.OptionButton weather 
      BackColor       =   &H00004080&
      Caption         =   "Rain"
      Height          =   255
      Index           =   1
      Left            =   9120
      TabIndex        =   46
      Top             =   9240
      Width           =   1095
   End
   Begin VB.OptionButton weather 
      BackColor       =   &H00004080&
      Caption         =   "None"
      Height          =   255
      Index           =   0
      Left            =   7920
      TabIndex        =   45
      Top             =   9240
      Value           =   -1  'True
      Width           =   1095
   End
   Begin VB.CommandButton Command5 
      Caption         =   "Reset All"
      Height          =   255
      Left            =   7080
      TabIndex        =   44
      Top             =   8760
      Width           =   1575
   End
   Begin VB.PictureBox Picture2 
      Height          =   2535
      Left            =   240
      ScaleHeight     =   2475
      ScaleWidth      =   1635
      TabIndex        =   41
      Top             =   960
      Visible         =   0   'False
      Width           =   1695
      Begin VB.Label Label11 
         Caption         =   "kills"
         BeginProperty Font 
            Name            =   "Arial"
            Size            =   12
            Charset         =   0
            Weight          =   400
            Underline       =   0   'False
            Italic          =   0   'False
            Strikethrough   =   0   'False
         EndProperty
         Height          =   375
         Left            =   960
         TabIndex        =   43
         Top             =   840
         Width           =   1335
      End
      Begin VB.Label Label10 
         Caption         =   "Kills for that Round"
         BeginProperty Font 
            Name            =   "Arial"
            Size            =   14.25
            Charset         =   0
            Weight          =   400
            Underline       =   0   'False
            Italic          =   0   'False
            Strikethrough   =   0   'False
         EndProperty
         Height          =   495
         Left            =   480
         TabIndex        =   42
         Top             =   240
         Width           =   2415
      End
   End
   Begin VB.PictureBox Picture1 
      AutoSize        =   -1  'True
      BorderStyle     =   0  'None
      Height          =   1980
      Left            =   5760
      Picture         =   "mmode.frx":A02B
      ScaleHeight     =   1980
      ScaleWidth      =   4305
      TabIndex        =   39
      Top             =   0
      Width           =   4305
   End
   Begin VB.Timer Timer1 
      Interval        =   100
      Left            =   1800
      Top             =   6720
   End
   Begin VB.CommandButton Command4 
      Caption         =   "Remove"
      Height          =   375
      Left            =   6360
      TabIndex        =   37
      Top             =   6720
      Width           =   975
   End
   Begin VB.FileListBox foreground 
      Height          =   1065
      Left            =   9480
      Pattern         =   "fore*.bmp"
      TabIndex        =   35
      Top             =   6360
      Width           =   2775
   End
   Begin VB.CommandButton Command3 
      Caption         =   "QUIT"
      Height          =   255
      Left            =   6000
      TabIndex        =   34
      Top             =   9960
      Width           =   3015
   End
   Begin VB.CommandButton Command2 
      Caption         =   "GO"
      BeginProperty Font 
         Name            =   "Arial"
         Size            =   48
         Charset         =   0
         Weight          =   400
         Underline       =   0   'False
         Italic          =   0   'False
         Strikethrough   =   0   'False
      EndProperty
      Height          =   1065
      Left            =   3480
      TabIndex        =   33
      Top             =   8640
      Width           =   1815
   End
   Begin VB.TextBox timetokill 
      Height          =   375
      Left            =   3720
      TabIndex        =   31
      Text            =   "30"
      Top             =   8040
      Width           =   1575
   End
   Begin VB.ListBox fready 
      Height          =   1425
      Left            =   6360
      TabIndex        =   29
      Top             =   7200
      Width           =   2895
   End
   Begin VB.TextBox numof 
      Height          =   495
      Left            =   7080
      TabIndex        =   28
      Top             =   6000
      Width           =   735
   End
   Begin VB.CommandButton Command1 
      Caption         =   "Submit Fairies for Slaughtering"
      Height          =   495
      Left            =   7920
      TabIndex        =   27
      Top             =   6000
      Width           =   1455
   End
   Begin VB.FileListBox music 
      Height          =   870
      Left            =   9600
      Pattern         =   "mus*.wav"
      TabIndex        =   26
      Top             =   8040
      Width           =   2655
   End
   Begin VB.TextBox ammo 
      Alignment       =   1  'Right Justify
      Height          =   375
      Index           =   9
      Left            =   5160
      TabIndex        =   21
      Top             =   6240
      Width           =   615
   End
   Begin VB.TextBox ammo 
      Alignment       =   1  'Right Justify
      Height          =   375
      Index           =   8
      Left            =   5160
      TabIndex        =   20
      Top             =   5880
      Width           =   615
   End
   Begin VB.TextBox ammo 
      Alignment       =   1  'Right Justify
      Height          =   375
      Index           =   7
      Left            =   5160
      TabIndex        =   19
      Top             =   5520
      Width           =   615
   End
   Begin VB.TextBox ammo 
      Alignment       =   1  'Right Justify
      Height          =   375
      Index           =   6
      Left            =   5160
      TabIndex        =   18
      Top             =   5160
      Width           =   615
   End
   Begin VB.TextBox ammo 
      Alignment       =   1  'Right Justify
      Height          =   375
      Index           =   5
      Left            =   5160
      TabIndex        =   17
      Top             =   4800
      Width           =   615
   End
   Begin VB.TextBox ammo 
      Alignment       =   1  'Right Justify
      Height          =   375
      Index           =   4
      Left            =   5160
      TabIndex        =   16
      Top             =   4440
      Width           =   615
   End
   Begin VB.TextBox ammo 
      Alignment       =   1  'Right Justify
      Height          =   375
      Index           =   3
      Left            =   5160
      TabIndex        =   15
      Top             =   4080
      Width           =   615
   End
   Begin VB.TextBox ammo 
      Alignment       =   1  'Right Justify
      Height          =   375
      Index           =   2
      Left            =   5160
      TabIndex        =   14
      Top             =   3720
      Width           =   615
   End
   Begin VB.TextBox ammo 
      Alignment       =   1  'Right Justify
      Height          =   375
      Index           =   1
      Left            =   5160
      TabIndex        =   13
      Top             =   3360
      Width           =   615
   End
   Begin VB.TextBox ammo 
      Alignment       =   1  'Right Justify
      Enabled         =   0   'False
      Height          =   375
      Index           =   0
      Left            =   5160
      TabIndex        =   12
      Text            =   "999"
      Top             =   3000
      Width           =   615
   End
   Begin VB.CheckBox weapcheck 
      BackColor       =   &H00004080&
      Caption         =   "Chip-Off"
      Enabled         =   0   'False
      Height          =   375
      Index           =   9
      Left            =   2760
      TabIndex        =   11
      Top             =   6240
      Width           =   2295
   End
   Begin VB.CheckBox weapcheck 
      BackColor       =   &H00004080&
      Caption         =   "Black hole SUN!"
      Height          =   375
      Index           =   8
      Left            =   2760
      TabIndex        =   10
      Top             =   5880
      Width           =   2295
   End
   Begin VB.CheckBox weapcheck 
      BackColor       =   &H00004080&
      Caption         =   "Mr. Piano Man"
      Height          =   375
      Index           =   7
      Left            =   2760
      TabIndex        =   9
      Top             =   5520
      Width           =   2295
   End
   Begin VB.CheckBox weapcheck 
      BackColor       =   &H00004080&
      Caption         =   "Ion O' Death"
      Height          =   375
      Index           =   6
      Left            =   2760
      TabIndex        =   8
      Top             =   5160
      Width           =   2295
   End
   Begin VB.CheckBox weapcheck 
      BackColor       =   &H00004080&
      Caption         =   "Da Bus"
      Height          =   375
      Index           =   5
      Left            =   2760
      TabIndex        =   7
      Top             =   4800
      Width           =   2295
   End
   Begin VB.CheckBox weapcheck 
      BackColor       =   &H00004080&
      Caption         =   "Fairy Mines"
      Height          =   375
      Index           =   4
      Left            =   2760
      TabIndex        =   6
      Top             =   4440
      Width           =   2295
   End
   Begin VB.CheckBox weapcheck 
      BackColor       =   &H00004080&
      Caption         =   "Da Howitzer"
      Height          =   375
      Index           =   3
      Left            =   2760
      TabIndex        =   5
      Top             =   4080
      Width           =   2295
   End
   Begin VB.CheckBox weapcheck 
      BackColor       =   &H00004080&
      Caption         =   "Machine Gun"
      Height          =   375
      Index           =   2
      Left            =   2760
      TabIndex        =   4
      Top             =   3720
      Width           =   2295
   End
   Begin VB.CheckBox weapcheck 
      BackColor       =   &H00004080&
      Caption         =   "Shotgun"
      Height          =   375
      Index           =   1
      Left            =   2760
      TabIndex        =   3
      Top             =   3360
      Width           =   2295
   End
   Begin VB.CheckBox weapcheck 
      BackColor       =   &H00004080&
      Caption         =   "Magnum"
      Enabled         =   0   'False
      Height          =   375
      Index           =   0
      Left            =   2760
      TabIndex        =   2
      Top             =   3000
      Value           =   1  'Checked
      Width           =   2295
   End
   Begin VB.ListBox favailable 
      Height          =   2790
      Left            =   6480
      TabIndex        =   1
      Top             =   3000
      Width           =   3015
   End
   Begin VB.FileListBox background 
      Height          =   2820
      Left            =   9480
      Pattern         =   "*.bmp"
      TabIndex        =   0
      Top             =   3000
      Width           =   2775
   End
   Begin VB.Label Label12 
      Alignment       =   1  'Right Justify
      BackStyle       =   0  'Transparent
      Caption         =   "Weather:"
      BeginProperty Font 
         Name            =   "Arial"
         Size            =   12
         Charset         =   0
         Weight          =   400
         Underline       =   0   'False
         Italic          =   0   'False
         Strikethrough   =   0   'False
      EndProperty
      ForeColor       =   &H0000C000&
      Height          =   375
      Left            =   6120
      TabIndex        =   48
      Top             =   9240
      Width           =   1815
   End
   Begin VB.Label Label9 
      BackStyle       =   0  'Transparent
      Caption         =   "Massacre Mode"
      BeginProperty Font 
         Name            =   "Arial"
         Size            =   27.75
         Charset         =   0
         Weight          =   400
         Underline       =   0   'False
         Italic          =   0   'False
         Strikethrough   =   0   'False
      EndProperty
      ForeColor       =   &H0000C000&
      Height          =   615
      Left            =   6240
      TabIndex        =   40
      Top             =   1920
      Width           =   4095
   End
   Begin VB.Label Label8 
      Alignment       =   2  'Center
      BackStyle       =   0  'Transparent
      Height          =   375
      Left            =   8280
      TabIndex        =   38
      Top             =   8640
      Width           =   975
   End
   Begin VB.Label Label7 
      BackStyle       =   0  'Transparent
      Caption         =   "Your Fore Ground"
      BeginProperty Font 
         Name            =   "Arial"
         Size            =   15.75
         Charset         =   0
         Weight          =   700
         Underline       =   0   'False
         Italic          =   0   'False
         Strikethrough   =   0   'False
      EndProperty
      ForeColor       =   &H0000C000&
      Height          =   375
      Left            =   9600
      TabIndex        =   36
      Top             =   5880
      Width           =   3135
   End
   Begin VB.Label Label6 
      BackStyle       =   0  'Transparent
      Caption         =   "How Long would you like to slaughter perfectly innocent fairies for? In seconds...."
      BeginProperty Font 
         Name            =   "Arial"
         Size            =   12
         Charset         =   0
         Weight          =   700
         Underline       =   0   'False
         Italic          =   0   'False
         Strikethrough   =   0   'False
      EndProperty
      ForeColor       =   &H0000C000&
      Height          =   1335
      Left            =   3240
      TabIndex        =   32
      Top             =   6840
      Width           =   2775
   End
   Begin VB.Label Label5 
      BackStyle       =   0  'Transparent
      Caption         =   "Fairies Ready to Die"
      BeginProperty Font 
         Name            =   "Arial"
         Size            =   15.75
         Charset         =   0
         Weight          =   700
         Underline       =   0   'False
         Italic          =   0   'False
         Strikethrough   =   0   'False
      EndProperty
      ForeColor       =   &H0000C000&
      Height          =   375
      Left            =   7560
      TabIndex        =   30
      Top             =   6720
      Width           =   1575
   End
   Begin VB.Label Label4 
      BackStyle       =   0  'Transparent
      Caption         =   "Your Music"
      BeginProperty Font 
         Name            =   "Arial"
         Size            =   15.75
         Charset         =   0
         Weight          =   700
         Underline       =   0   'False
         Italic          =   0   'False
         Strikethrough   =   0   'False
      EndProperty
      ForeColor       =   &H0000C000&
      Height          =   375
      Left            =   9720
      TabIndex        =   25
      Top             =   7560
      Width           =   2535
   End
   Begin VB.Label Label3 
      BackStyle       =   0  'Transparent
      Caption         =   "Your Locale"
      BeginProperty Font 
         Name            =   "Arial"
         Size            =   15.75
         Charset         =   0
         Weight          =   700
         Underline       =   0   'False
         Italic          =   0   'False
         Strikethrough   =   0   'False
      EndProperty
      ForeColor       =   &H0000C000&
      Height          =   375
      Left            =   9840
      TabIndex        =   24
      Top             =   2640
      Width           =   2415
   End
   Begin VB.Label Label2 
      BackStyle       =   0  'Transparent
      Caption         =   "Your Innocent Fairies"
      BeginProperty Font 
         Name            =   "Arial"
         Size            =   15.75
         Charset         =   0
         Weight          =   700
         Underline       =   0   'False
         Italic          =   0   'False
         Strikethrough   =   0   'False
      EndProperty
      ForeColor       =   &H0000C000&
      Height          =   375
      Left            =   6240
      TabIndex        =   23
      Top             =   2640
      Width           =   3375
   End
   Begin VB.Label Label1 
      BackStyle       =   0  'Transparent
      Caption         =   "Your Arsenal"
      BeginProperty Font 
         Name            =   "Arial"
         Size            =   15.75
         Charset         =   0
         Weight          =   700
         Underline       =   0   'False
         Italic          =   0   'False
         Strikethrough   =   0   'False
      EndProperty
      ForeColor       =   &H0000C000&
      Height          =   495
      Left            =   2880
      TabIndex        =   22
      Top             =   2400
      Width           =   2415
   End
End
Attribute VB_Name = "mmode"
Attribute VB_GlobalNameSpace = False
Attribute VB_Creatable = False
Attribute VB_PredeclaredId = True
Attribute VB_Exposed = False
Private numf As Integer


Private Sub ammo_Change(Index As Integer)
If ammo(Index).Text <> "" Then weapcheck(Index).Value = 1
End Sub

Private Sub Command1_Click()
If Val(numof) <= 0 Then Exit Sub
If fready.ListCount >= MAXFTYPES Then Exit Sub
If favailable.ListIndex = -1 Then Exit Sub
If numf + Val(numof) > MAXFAIRIES Then Exit Sub

numf = numf + Val(numof)
fready.AddItem numof + ":   " + favailable.List(favailable.ListIndex)
numof.Text = ""
End Sub

Private Sub Command2_Click()
On Error Resume Next
If background.ListIndex = -1 Then background.ListIndex = 0
If Val(timetokill) <= 0 Then timetokill = "60"
If music.ListIndex = -1 Then music.ListIndex = 0

Open App.Path + "\massacre.mof" For Output As #1
   
   Print #1, "<scenario>"
   Print #1, "start=custom"
   For x = 0 To 9
      If weapcheck(x).Value = 1 Then
         Print #1, "weapon" + Right$(Str$(x + 1), 1) + "=" + Str$(CInt(ammo(x)))
      End If
   Next x
   Print #1, "worth=-10"
   Print #1, "</scenario>"
   
   Print #1, "<levels>"
   Print #1, "<custom>"
   Print #1, "name=Your Own Custom Massacre"
   Print #1, "bgpic=" + background.List(background.ListIndex)
   Print #1, "sngname=" + music.List(music.ListIndex)
   Print #1, "timelimit=" + timetokill
   If weather(1).Value = True Then Print #1, "weather=rain"
   If weather(2).Value = True Then Print #1, "weather=snow"
   If foreground.ListIndex <> -1 Then Print #1, "fground=" + foreground.List(foreground.ListIndex)
   For x = 1 To fready.ListCount
      Item$ = Left$(fready.List(x - 1), InStr(fready.List(x - 1), ":") - 1)
      aguy$ = Right$(fready.List(x - 1), Len(fready.List(x - 1)) - InStr(fready.List(x - 1), ":") - 3)
      Print #1, aguy$ + "=" + Item$
    Next x
   Print #1, "next=end"
   Print #1, "</custom>"
   Print #1, "</levels>"
Open App.Path + "\mmode.txt" For Input As #2
   While Not EOF(2)
      Line Input #2, bozo$
      Print #1, bozo$
    Wend
Close #2
Close #1

shutdown
Unload Me
gamemain.BeginGame "massacre.mof"
Unload gamemain
Set gamemain = Nothing
Load Me
End Sub

Private Sub Command3_Click()
shutdown
Unload mmode
Set mmode = Nothing
Load Form2

End Sub

Private Sub Command4_Click()
If fready.ListIndex = -1 Then Exit Sub
Item = Val(Left$(fready.List(fready.ListIndex), InStr(fready.List(fready.ListIndex), ":")))
numf = numf - Item
fready.RemoveItem (fready.ListIndex)
End Sub

Private Sub Command5_Click()
For x = 1 To 9
   weapcheck(x).Value = 0
   ammo(x).Text = ""
Next x
favailable.ListIndex = -1
background.ListIndex = -1
foreground.ListIndex = -1
music.ListIndex = -1
fready.Clear
timetokill.Text = "30"
numof.Text = ""
weather(0).Value = True
weather(1).Value = False
weather(2).Value = False
End Sub

Private Sub Command6_Click()
For x = 1 To 9
bozo = Int(Rnd(1) * 5)
If bozo = 3 Then ammo(x).Text = Int(Rnd(1) * 99) + 1
Next x

For x = 1 To 8

bigboy = Int(Rnd(1) * 3)


If bigboy = 2 Then
bingo = Int(Rnd(1) * favailable.ListCount)
favailable.Selected(bingo) = True
numof.Text = bigboy * x
fready.AddItem numof + ":   " + favailable.List(favailable.ListIndex)
'fready.AddItem (favailable.List(bingo))
numof.Text = ""
End If

Next x



bingo2 = Int(Rnd(1) * background.ListCount)
background.Selected(bingo2) = True

bingo3 = Int(Rnd(1) * foreground.ListCount)
foreground.Selected(bingo3) = True

bingo4 = Int(Rnd(1) * music.ListCount)
music.Selected(bingo4) = True




End Sub

Private Sub Form_Load()
Unload Form2
''Scrap = Init_InitializeDirectSound(Me)
init Me
background.Path = App.Path + "\bg\"
foreground.Path = App.Path + "\fg\"
music.Path = App.Path + "\sfx\"
numf = 0
loaddata_datafiles
Randomize Timer
End Sub
Sub loaddata_datafiles()
Static bozo As String
Open App.Path + "\mmode.txt" For Input As #3
   
   favailable.Clear
   
   Line Input #3, bozo
   While getkey(bozo) <> "fairies" And Not EOF(3)
      Line Input #3, bozo
   Wend
   
   If EOF(3) Then
      Close #3
      Exit Sub
    End If
   
   Line Input #3, bozo
   While Not EOF(3)
    If Len(getkey(bozo)) > 1 And Left$(getkey(bozo), 1) <> "/" Then
       favailable.AddItem getkey(bozo)
    End If
    Line Input #3, bozo
   Wend
   
Close #3
   
       
                         
End Sub

Private Sub Picture2_Click()
Picture2.Visible = False
End Sub

Private Sub Timer1_Timer()
Label8 = Str$(numf)
End Sub

Private Sub weather_Click(Index As Integer)
  Select Case Index
      Case Is = 0
         weather(0).Value = True
         weather(1).Value = False
         weather(2).Value = False
      Case Is = 1
         weather(0).Value = False
         weather(1).Value = True
         weather(2).Value = False
      Case Is = 2
         weather(0).Value = False
         weather(1).Value = False
         weather(2).Value = True
       End Select
  
End Sub
