VERSION 5.00
Object = "{BDC217C8-ED16-11CD-956C-0000C04E4C0A}#1.1#0"; "TABCTL32.OCX"
Begin VB.Form Form3 
   BorderStyle     =   3  'Fixed Dialog
   Caption         =   "High Scores"
   ClientHeight    =   6105
   ClientLeft      =   600
   ClientTop       =   1380
   ClientWidth     =   5115
   LinkTopic       =   "Form3"
   MaxButton       =   0   'False
   MinButton       =   0   'False
   PaletteMode     =   1  'UseZOrder
   ScaleHeight     =   6105
   ScaleWidth      =   5115
   ShowInTaskbar   =   0   'False
   Begin VB.CommandButton Command2 
      Caption         =   "Clear High Scores"
      Height          =   255
      Left            =   3240
      TabIndex        =   2
      Top             =   5760
      Width           =   1695
   End
   Begin VB.CommandButton Command1 
      Caption         =   "OK"
      Height          =   255
      Left            =   120
      TabIndex        =   1
      Top             =   5760
      Width           =   1575
   End
   Begin TabDlg.SSTab Tab1 
      Height          =   4455
      Left            =   0
      TabIndex        =   3
      Top             =   1200
      Width           =   5055
      _ExtentX        =   8916
      _ExtentY        =   7858
      _Version        =   327680
      Tabs            =   2
      TabsPerRow      =   2
      TabHeight       =   520
      TabCaption(0)   =   "Games Highs"
      Tab(0).ControlCount=   1
      Tab(0).ControlEnabled=   -1  'True
      Tab(0).Control(0)=   "List1"
      Tab(0).Control(0).Enabled=   0   'False
      TabCaption(1)   =   "Massacre Highs"
      Tab(1).ControlCount=   1
      Tab(1).ControlEnabled=   0   'False
      Tab(1).Control(0)=   "Label1"
      Tab(1).Control(0).Enabled=   -1  'True
      Begin VB.ListBox List1 
         Height          =   3765
         Left            =   120
         TabIndex        =   4
         Top             =   480
         Width           =   4815
      End
      Begin VB.Label Label1 
         Alignment       =   2  'Center
         Caption         =   "REGISTERED VERSION ONLY!!! BUY THE DAMN GAME YOU FAIRY!!!!!"
         BeginProperty Font 
            Name            =   "MS Sans Serif"
            Size            =   13.5
            Charset         =   0
            Weight          =   400
            Underline       =   0   'False
            Italic          =   0   'False
            Strikethrough   =   0   'False
         EndProperty
         Height          =   2175
         Left            =   -73680
         TabIndex        =   5
         Top             =   720
         Width           =   2175
      End
   End
   Begin VB.Label Label2 
      Alignment       =   2  'Center
      Caption         =   "High Scores"
      BeginProperty Font 
         Name            =   "Times New Roman"
         Size            =   36
         Charset         =   0
         Weight          =   400
         Underline       =   0   'False
         Italic          =   0   'False
         Strikethrough   =   0   'False
      EndProperty
      Height          =   855
      Left            =   720
      TabIndex        =   0
      Top             =   120
      Width           =   3735
   End
End
Attribute VB_Name = "Form3"
Attribute VB_GlobalNameSpace = False
Attribute VB_Creatable = False
Attribute VB_PredeclaredId = True
Attribute VB_Exposed = False
Private Sub Command1_Click()
Unload Form3
Set Form3 = Nothing

End Sub


Private Sub Command2_Click()
On Error Resume Next
Kill App.Path + "\ghscores.p&p"
If Err Then MsgBox "There aren't any high scoes to clear!"
End Sub


