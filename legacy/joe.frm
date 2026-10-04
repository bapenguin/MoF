VERSION 5.00
Begin VB.Form Form2 
   Appearance      =   0  'Flat
   BackColor       =   &H80000005&
   BorderStyle     =   0  'None
   ClientHeight    =   8925
   ClientLeft      =   0
   ClientTop       =   0
   ClientWidth     =   10770
   ControlBox      =   0   'False
   Icon            =   "joe.frx":0000
   LinkTopic       =   "Form2"
   MaxButton       =   0   'False
   MinButton       =   0   'False
   Moveable        =   0   'False
   NegotiateMenus  =   0   'False
   ScaleHeight     =   8925
   ScaleWidth      =   10770
   ShowInTaskbar   =   0   'False
   StartUpPosition =   3  'Windows Default
   Begin VB.PictureBox Picture2 
      AutoSize        =   -1  'True
      Height          =   1845
      Left            =   6480
      Picture         =   "joe.frx":287A
      ScaleHeight     =   1785
      ScaleWidth      =   3000
      TabIndex        =   5
      Top             =   5280
      Width           =   3060
   End
   Begin VB.PictureBox Picture1 
      Appearance      =   0  'Flat
      AutoSize        =   -1  'True
      BackColor       =   &H80000005&
      BorderStyle     =   0  'None
      ForeColor       =   &H80000008&
      Height          =   3000
      Left            =   6480
      Picture         =   "joe.frx":13FA4
      ScaleHeight     =   3000
      ScaleWidth      =   3000
      TabIndex        =   4
      Top             =   2040
      Width           =   3000
   End
   Begin VB.Frame Frame1 
      BorderStyle     =   0  'None
      Height          =   3735
      Left            =   5760
      TabIndex        =   0
      Top             =   5160
      Width           =   4455
      Begin VB.Label Label4 
         AutoSize        =   -1  'True
         Caption         =   "Quit dis' Shit!"
         BeginProperty Font 
            Name            =   "Garamond"
            Size            =   14.25
            Charset         =   0
            Weight          =   400
            Underline       =   0   'False
            Italic          =   0   'False
            Strikethrough   =   0   'False
         EndProperty
         Height          =   315
         Left            =   1320
         TabIndex        =   3
         Top             =   3120
         Width           =   1515
      End
      Begin VB.Label Label3 
         AutoSize        =   -1  'True
         Caption         =   "Massacre dem' Fairies"
         BeginProperty Font 
            Name            =   "Garamond"
            Size            =   14.25
            Charset         =   0
            Weight          =   400
            Underline       =   0   'False
            Italic          =   0   'False
            Strikethrough   =   0   'False
         EndProperty
         Height          =   315
         Left            =   840
         TabIndex        =   2
         Top             =   2640
         Width           =   2430
      End
      Begin VB.Label Label2 
         AutoSize        =   -1  'True
         Caption         =   "Your Very Own Fairy Adventure"
         BeginProperty Font 
            Name            =   "Garamond"
            Size            =   15.75
            Charset         =   0
            Weight          =   400
            Underline       =   0   'False
            Italic          =   0   'False
            Strikethrough   =   0   'False
         EndProperty
         Height          =   360
         Left            =   120
         TabIndex        =   1
         Top             =   2160
         Width           =   4065
      End
   End
End
Attribute VB_Name = "Form2"
Attribute VB_GlobalNameSpace = False
Attribute VB_Creatable = False
Attribute VB_PredeclaredId = True
Attribute VB_Exposed = False

Private Sub Form_Load()
Unload Form1
Form2.Picture = LoadPicture(App.Path + "\bforrest.bmp")
Scrap = Init_InitializeDirectSound(Me)
backsound3 = General_LoadStaticSound(App.Path + "\music2.wav", False)
Call General_PlaySound(backsound3, True)
init Me


End Sub

Private Sub Frame1_MouseMove(Button As Integer, Shift As Integer, x As Single, y As Single)
Label2.ForeColor = 0
Label4.ForeColor = 0
Label3.ForeColor = 0
End Sub


Private Sub Label2_MouseDown(Button As Integer, Shift As Integer, x As Single, y As Single)

shutdown
Load main
Unload main
Set main = Nothing



End Sub

Private Sub Label2_MouseMove(Button As Integer, Shift As Integer, x As Single, y As Single)
Label3.ForeColor = &H0
Label2.ForeColor = &HFFFFFF
Label4.ForeColor = &H0
End Sub

Private Sub Label3_MouseDown(Button As Integer, Shift As Integer, x As Single, y As Single)
Call General_PlaySound(bozo1, False)
'Call General_PlaySound(bozo2, False)
End Sub

Private Sub Label3_MouseMove(Button As Integer, Shift As Integer, x As Single, y As Single)
Label3.ForeColor = &HFFFFFF
Label2.ForeColor = 0
Label4.ForeColor = 0
End Sub

Private Sub Label4_MouseMove(Button As Integer, Shift As Integer, x As Single, y As Single)
Label3.ForeColor = 0
Label2.ForeColor = 0
Label4.ForeColor = &HFFFFFF
End Sub

Private Sub Label4_Click()
shutdown
End
End Sub

