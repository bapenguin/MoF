VERSION 5.00
Begin VB.Form Form2 
   Appearance      =   0  'Flat
   BackColor       =   &H80000005&
   BorderStyle     =   0  'None
   ClientHeight    =   12960
   ClientLeft      =   0
   ClientTop       =   0
   ClientWidth     =   17325
   ControlBox      =   0   'False
   Icon            =   "test.frx":0000
   LinkTopic       =   "Form2"
   MaxButton       =   0   'False
   MinButton       =   0   'False
   Moveable        =   0   'False
   NegotiateMenus  =   0   'False
   ScaleHeight     =   12960
   ScaleWidth      =   17325
   ShowInTaskbar   =   0   'False
   StartUpPosition =   3  'Windows Default
   Begin VB.FileListBox File1 
      Height          =   675
      Left            =   360
      Pattern         =   "*.guy"
      TabIndex        =   66
      Top             =   2400
      Visible         =   0   'False
      Width           =   1935
   End
   Begin VB.PictureBox Picture8 
      BorderStyle     =   0  'None
      Height          =   4095
      Left            =   5400
      Picture         =   "test.frx":0CCA
      ScaleHeight     =   4095
      ScaleWidth      =   4575
      TabIndex        =   46
      Top             =   5400
      Width           =   4575
      Begin VB.PictureBox Picture2 
         BorderStyle     =   0  'None
         Height          =   2175
         Index           =   1
         Left            =   240
         Picture         =   "test.frx":59350
         ScaleHeight     =   2175
         ScaleWidth      =   4080
         TabIndex        =   67
         Top             =   120
         Width           =   4080
      End
      Begin VB.Label Label13 
         Alignment       =   2  'Center
         BackStyle       =   0  'Transparent
         Caption         =   "MoF HoF"
         BeginProperty Font 
            Name            =   "Arial"
            Size            =   14.25
            Charset         =   0
            Weight          =   400
            Underline       =   0   'False
            Italic          =   0   'False
            Strikethrough   =   0   'False
         EndProperty
         Height          =   375
         Left            =   1320
         TabIndex        =   65
         Top             =   3360
         Width           =   1695
      End
      Begin VB.Label Label4 
         Alignment       =   2  'Center
         AutoSize        =   -1  'True
         BackStyle       =   0  'Transparent
         Caption         =   "Quit dis' Shit!"
         BeginProperty Font 
            Name            =   "Arial"
            Size            =   14.25
            Charset         =   0
            Weight          =   400
            Underline       =   0   'False
            Italic          =   0   'False
            Strikethrough   =   0   'False
         EndProperty
         Height          =   315
         Left            =   1080
         TabIndex        =   50
         Top             =   3720
         Width           =   2115
      End
      Begin VB.Label Label9 
         Alignment       =   2  'Center
         BackStyle       =   0  'Transparent
         Caption         =   "Options"
         BeginProperty Font 
            Name            =   "Arial"
            Size            =   14.25
            Charset         =   0
            Weight          =   400
            Underline       =   0   'False
            Italic          =   0   'False
            Strikethrough   =   0   'False
         EndProperty
         Height          =   375
         Left            =   840
         TabIndex        =   49
         Top             =   3000
         Width           =   2535
      End
      Begin VB.Label Label3 
         AutoSize        =   -1  'True
         BackStyle       =   0  'Transparent
         Caption         =   "Massacre dem' Fairies"
         BeginProperty Font 
            Name            =   "Arial"
            Size            =   14.25
            Charset         =   0
            Weight          =   400
            Underline       =   0   'False
            Italic          =   0   'False
            Strikethrough   =   0   'False
         EndProperty
         Height          =   315
         Left            =   960
         TabIndex        =   48
         Top             =   2640
         Width           =   3015
      End
      Begin VB.Label Label2 
         AutoSize        =   -1  'True
         BackStyle       =   0  'Transparent
         Caption         =   "Your Very Own Fairy Adventure"
         BeginProperty Font 
            Name            =   "Arial"
            Size            =   15.75
            Charset         =   0
            Weight          =   400
            Underline       =   0   'False
            Italic          =   0   'False
            Strikethrough   =   0   'False
         EndProperty
         Height          =   360
         Left            =   120
         TabIndex        =   47
         Top             =   2280
         Width           =   4425
      End
   End
   Begin VB.PictureBox optionspic 
      Height          =   2535
      Left            =   6600
      Picture         =   "test.frx":A2772
      ScaleHeight     =   2475
      ScaleWidth      =   2115
      TabIndex        =   35
      Top             =   6960
      Visible         =   0   'False
      Width           =   2175
      Begin VB.CheckBox ambcheck 
         BackColor       =   &H00004080&
         Caption         =   "Ambient Sounds"
         Height          =   255
         Left            =   0
         TabIndex        =   41
         Top             =   1200
         Value           =   1  'Checked
         Width           =   2175
      End
      Begin VB.CommandButton OptionsOk 
         Caption         =   "Ok"
         Height          =   375
         Left            =   360
         TabIndex        =   39
         Top             =   2040
         Width           =   1215
      End
      Begin VB.CheckBox weathchk 
         BackColor       =   &H00004080&
         Caption         =   "Weather Effects"
         Height          =   255
         Left            =   0
         TabIndex        =   38
         Top             =   1680
         Value           =   1  'Checked
         Width           =   3735
      End
      Begin VB.CheckBox musicchk 
         BackColor       =   &H00004080&
         Caption         =   "Music"
         Height          =   255
         Left            =   0
         TabIndex        =   37
         Top             =   1440
         Value           =   1  'Checked
         Width           =   3615
      End
      Begin VB.CheckBox sndcheck 
         BackColor       =   &H00004080&
         Caption         =   "Sound"
         Height          =   255
         Left            =   0
         TabIndex        =   36
         Top             =   960
         Value           =   1  'Checked
         Width           =   2895
      End
      Begin VB.Label Label8 
         Alignment       =   2  'Center
         BackStyle       =   0  'Transparent
         Caption         =   "Options"
         BeginProperty Font 
            Name            =   "Tahoma"
            Size            =   14.25
            Charset         =   0
            Weight          =   400
            Underline       =   0   'False
            Italic          =   0   'False
            Strikethrough   =   0   'False
         EndProperty
         Height          =   375
         Left            =   360
         TabIndex        =   40
         Top             =   360
         Width           =   1335
      End
   End
   Begin VB.PictureBox roundsel 
      Appearance      =   0  'Flat
      BackColor       =   &H80000005&
      ForeColor       =   &H80000008&
      Height          =   6615
      Left            =   3240
      Picture         =   "test.frx":FADF8
      ScaleHeight     =   6585
      ScaleWidth      =   8985
      TabIndex        =   27
      Top             =   1680
      Visible         =   0   'False
      Width           =   9015
      Begin VB.PictureBox levpic 
         AutoSize        =   -1  'True
         Height          =   1185
         Index           =   3
         Left            =   120
         Picture         =   "test.frx":2028FA
         ScaleHeight     =   1125
         ScaleWidth      =   1500
         TabIndex        =   51
         Top             =   4680
         Width           =   1560
         Begin VB.Label levtitle 
            Alignment       =   2  'Center
            BackStyle       =   0  'Transparent
            Caption         =   "Da Fairy Kingdom"
            BeginProperty Font 
               Name            =   "Arial"
               Size            =   12
               Charset         =   0
               Weight          =   700
               Underline       =   0   'False
               Italic          =   0   'False
               Strikethrough   =   0   'False
            EndProperty
            ForeColor       =   &H00C00000&
            Height          =   735
            Index           =   3
            Left            =   120
            TabIndex        =   52
            Top             =   240
            Width           =   1215
         End
      End
      Begin VB.PictureBox levpic 
         AutoSize        =   -1  'True
         Height          =   1185
         Index           =   2
         Left            =   120
         Picture         =   "test.frx":208120
         ScaleHeight     =   1125
         ScaleWidth      =   1500
         TabIndex        =   42
         Top             =   3360
         Width           =   1560
         Begin VB.Label levtitle 
            Alignment       =   2  'Center
            BackStyle       =   0  'Transparent
            Caption         =   "Barren BURR!"
            BeginProperty Font 
               Name            =   "Arial"
               Size            =   12
               Charset         =   0
               Weight          =   700
               Underline       =   0   'False
               Italic          =   0   'False
               Strikethrough   =   0   'False
            EndProperty
            ForeColor       =   &H00C00000&
            Height          =   735
            Index           =   2
            Left            =   120
            TabIndex        =   43
            Top             =   240
            Width           =   1215
         End
      End
      Begin VB.PictureBox levpic 
         AutoSize        =   -1  'True
         Height          =   1185
         Index           =   1
         Left            =   120
         Picture         =   "test.frx":20D946
         ScaleHeight     =   1125
         ScaleWidth      =   1500
         TabIndex        =   31
         Top             =   2040
         Width           =   1560
         Begin VB.Label levtitle 
            Alignment       =   2  'Center
            BackStyle       =   0  'Transparent
            Caption         =   "The Desert after Dinner"
            BeginProperty Font 
               Name            =   "Arial"
               Size            =   12
               Charset         =   0
               Weight          =   700
               Underline       =   0   'False
               Italic          =   0   'False
               Strikethrough   =   0   'False
            EndProperty
            ForeColor       =   &H00C00000&
            Height          =   1095
            Index           =   1
            Left            =   0
            TabIndex        =   34
            Top             =   240
            Width           =   1575
         End
      End
      Begin VB.CommandButton ronselcancel 
         Caption         =   "Cancel"
         Height          =   255
         Left            =   240
         TabIndex        =   30
         Top             =   6000
         Width           =   1095
      End
      Begin VB.PictureBox levpic 
         AutoSize        =   -1  'True
         Height          =   1185
         Index           =   0
         Left            =   120
         Picture         =   "test.frx":21316C
         ScaleHeight     =   1125
         ScaleWidth      =   1500
         TabIndex        =   28
         Top             =   720
         Width           =   1560
         Begin VB.Label levtitle 
            Alignment       =   2  'Center
            BackStyle       =   0  'Transparent
            Caption         =   "Into The Wilderness"
            BeginProperty Font 
               Name            =   "Arial"
               Size            =   12
               Charset         =   0
               Weight          =   700
               Underline       =   0   'False
               Italic          =   0   'False
               Strikethrough   =   0   'False
            EndProperty
            ForeColor       =   &H00C00000&
            Height          =   1335
            Index           =   0
            Left            =   0
            TabIndex        =   33
            Top             =   240
            Width           =   1575
         End
      End
      Begin VB.Label levdisc 
         BackStyle       =   0  'Transparent
         Caption         =   $"test.frx":218992
         BeginProperty Font 
            Name            =   "Verdana"
            Size            =   12
            Charset         =   0
            Weight          =   400
            Underline       =   0   'False
            Italic          =   0   'False
            Strikethrough   =   0   'False
         EndProperty
         ForeColor       =   &H0000C000&
         Height          =   1215
         Index           =   3
         Left            =   1800
         TabIndex        =   53
         Top             =   4680
         Width           =   6855
      End
      Begin VB.Label Label10 
         Alignment       =   2  'Center
         Appearance      =   0  'Flat
         BackColor       =   &H80000005&
         BackStyle       =   0  'Transparent
         Caption         =   "Fairy Adventures"
         BeginProperty Font 
            Name            =   "Arial"
            Size            =   24
            Charset         =   0
            Weight          =   400
            Underline       =   0   'False
            Italic          =   0   'False
            Strikethrough   =   0   'False
         EndProperty
         ForeColor       =   &H0000C000&
         Height          =   735
         Left            =   0
         TabIndex        =   45
         Top             =   0
         Width           =   8775
      End
      Begin VB.Label levdisc 
         BackStyle       =   0  'Transparent
         Caption         =   $"test.frx":218A46
         BeginProperty Font 
            Name            =   "Verdana"
            Size            =   12
            Charset         =   0
            Weight          =   400
            Underline       =   0   'False
            Italic          =   0   'False
            Strikethrough   =   0   'False
         EndProperty
         ForeColor       =   &H0000C000&
         Height          =   1215
         Index           =   2
         Left            =   1800
         TabIndex        =   44
         Top             =   3360
         Width           =   6975
      End
      Begin VB.Label levdisc 
         BackStyle       =   0  'Transparent
         Caption         =   $"test.frx":218AFD
         BeginProperty Font 
            Name            =   "Verdana"
            Size            =   12
            Charset         =   0
            Weight          =   400
            Underline       =   0   'False
            Italic          =   0   'False
            Strikethrough   =   0   'False
         EndProperty
         ForeColor       =   &H0000C000&
         Height          =   1215
         Index           =   1
         Left            =   1800
         TabIndex        =   32
         Top             =   2040
         Width           =   6855
      End
      Begin VB.Label levdisc 
         BackStyle       =   0  'Transparent
         Caption         =   $"test.frx":218BAF
         BeginProperty Font 
            Name            =   "Verdana"
            Size            =   12
            Charset         =   0
            Weight          =   400
            Underline       =   0   'False
            Italic          =   0   'False
            Strikethrough   =   0   'False
         EndProperty
         ForeColor       =   &H0000C000&
         Height          =   1335
         Index           =   0
         Left            =   1800
         TabIndex        =   29
         Top             =   600
         Width           =   7095
      End
   End
   Begin VB.PictureBox Picture5 
      Appearance      =   0  'Flat
      AutoSize        =   -1  'True
      BackColor       =   &H80000005&
      BorderStyle     =   0  'None
      ForeColor       =   &H80000008&
      Height          =   855
      Left            =   0
      ScaleHeight     =   855
      ScaleWidth      =   735
      TabIndex        =   25
      Top             =   7800
      Visible         =   0   'False
      Width           =   735
   End
   Begin VB.PictureBox Picture3 
      Appearance      =   0  'Flat
      AutoSize        =   -1  'True
      BackColor       =   &H80000005&
      BorderStyle     =   0  'None
      ForeColor       =   &H80000008&
      Height          =   9000
      Left            =   3480
      Picture         =   "test.frx":218C70
      ScaleHeight     =   9000
      ScaleWidth      =   8250
      TabIndex        =   14
      Top             =   1320
      Visible         =   0   'False
      Width           =   8250
      Begin VB.ListBox List1 
         Appearance      =   0  'Flat
         BackColor       =   &H000A2745&
         ForeColor       =   &H0000FF00&
         Height          =   3540
         Left            =   4560
         Sorted          =   -1  'True
         TabIndex        =   23
         Top             =   4560
         Width           =   3255
      End
      Begin VB.PictureBox Picture4 
         Appearance      =   0  'Flat
         BackColor       =   &H80000005&
         BorderStyle     =   0  'None
         ForeColor       =   &H80000008&
         Height          =   1695
         Left            =   720
         Picture         =   "test.frx":30AC92
         ScaleHeight     =   1695
         ScaleWidth      =   1815
         TabIndex        =   15
         Top             =   1320
         Width           =   1815
      End
      Begin VB.Shape Shape1 
         BorderColor     =   &H0000C000&
         Height          =   375
         Left            =   7680
         Top             =   120
         Width           =   495
      End
      Begin VB.Label Label7 
         Alignment       =   2  'Center
         BackStyle       =   0  'Transparent
         Caption         =   "X"
         BeginProperty Font 
            Name            =   "Arial"
            Size            =   15.75
            Charset         =   0
            Weight          =   400
            Underline       =   0   'False
            Italic          =   0   'False
            Strikethrough   =   0   'False
         EndProperty
         ForeColor       =   &H0000C000&
         Height          =   375
         Left            =   7680
         TabIndex        =   26
         Top             =   120
         Width           =   495
      End
      Begin VB.Label lblstreak 
         Alignment       =   2  'Center
         Appearance      =   0  'Flat
         BackColor       =   &H80000005&
         BackStyle       =   0  'Transparent
         Caption         =   "STUFF"
         BeginProperty Font 
            Name            =   "Arial"
            Size            =   12
            Charset         =   0
            Weight          =   400
            Underline       =   0   'False
            Italic          =   0   'False
            Strikethrough   =   0   'False
         EndProperty
         ForeColor       =   &H0000FF00&
         Height          =   375
         Left            =   2760
         TabIndex        =   24
         Top             =   8160
         Width           =   735
      End
      Begin VB.Label lblname 
         Alignment       =   2  'Center
         Appearance      =   0  'Flat
         BackColor       =   &H80000005&
         BackStyle       =   0  'Transparent
         Caption         =   "NAME GOES HERE"
         BeginProperty Font 
            Name            =   "Arial"
            Size            =   12
            Charset         =   0
            Weight          =   400
            Underline       =   0   'False
            Italic          =   0   'False
            Strikethrough   =   0   'False
         EndProperty
         ForeColor       =   &H0000FF00&
         Height          =   375
         Left            =   480
         TabIndex        =   22
         Top             =   3240
         Width           =   2415
      End
      Begin VB.Label lblacc 
         Alignment       =   2  'Center
         Appearance      =   0  'Flat
         BackColor       =   &H80000005&
         BackStyle       =   0  'Transparent
         Caption         =   "STUFF"
         BeginProperty Font 
            Name            =   "Arial"
            Size            =   12
            Charset         =   0
            Weight          =   400
            Underline       =   0   'False
            Italic          =   0   'False
            Strikethrough   =   0   'False
         EndProperty
         ForeColor       =   &H0000FF00&
         Height          =   375
         Left            =   1320
         TabIndex        =   21
         Top             =   8160
         Width           =   735
      End
      Begin VB.Label lbllevels 
         Alignment       =   2  'Center
         Appearance      =   0  'Flat
         BackColor       =   &H80000005&
         BackStyle       =   0  'Transparent
         Caption         =   "STUFF"
         BeginProperty Font 
            Name            =   "Arial"
            Size            =   12
            Charset         =   0
            Weight          =   400
            Underline       =   0   'False
            Italic          =   0   'False
            Strikethrough   =   0   'False
         EndProperty
         ForeColor       =   &H0000FF00&
         Height          =   375
         Left            =   840
         TabIndex        =   20
         Top             =   7440
         Width           =   1455
      End
      Begin VB.Label lblweap 
         Alignment       =   2  'Center
         Appearance      =   0  'Flat
         BackColor       =   &H80000005&
         BackStyle       =   0  'Transparent
         Caption         =   "STUFF"
         BeginProperty Font 
            Name            =   "Arial"
            Size            =   12
            Charset         =   0
            Weight          =   400
            Underline       =   0   'False
            Italic          =   0   'False
            Strikethrough   =   0   'False
         EndProperty
         ForeColor       =   &H0000FF00&
         Height          =   375
         Left            =   720
         TabIndex        =   19
         Top             =   6600
         Width           =   1695
      End
      Begin VB.Label lblhits 
         Alignment       =   2  'Center
         Appearance      =   0  'Flat
         BackColor       =   &H80000005&
         BackStyle       =   0  'Transparent
         Caption         =   "STUFF"
         BeginProperty Font 
            Name            =   "Arial"
            Size            =   12
            Charset         =   0
            Weight          =   400
            Underline       =   0   'False
            Italic          =   0   'False
            Strikethrough   =   0   'False
         EndProperty
         ForeColor       =   &H0000FF00&
         Height          =   375
         Left            =   720
         TabIndex        =   18
         Top             =   5760
         Width           =   1935
      End
      Begin VB.Label lblshots 
         Alignment       =   2  'Center
         Appearance      =   0  'Flat
         BackColor       =   &H80000005&
         BackStyle       =   0  'Transparent
         Caption         =   "STUFF"
         BeginProperty Font 
            Name            =   "Arial"
            Size            =   12
            Charset         =   0
            Weight          =   400
            Underline       =   0   'False
            Italic          =   0   'False
            Strikethrough   =   0   'False
         EndProperty
         ForeColor       =   &H0000FF00&
         Height          =   375
         Left            =   720
         TabIndex        =   17
         Top             =   5040
         Width           =   2055
      End
      Begin VB.Label lblscore 
         Alignment       =   2  'Center
         Appearance      =   0  'Flat
         BackColor       =   &H80000005&
         BackStyle       =   0  'Transparent
         Caption         =   "STUFF"
         BeginProperty Font 
            Name            =   "Arial"
            Size            =   12
            Charset         =   0
            Weight          =   400
            Underline       =   0   'False
            Italic          =   0   'False
            Strikethrough   =   0   'False
         EndProperty
         ForeColor       =   &H0000FF00&
         Height          =   375
         Left            =   600
         TabIndex        =   16
         Top             =   4320
         Width           =   2175
      End
   End
   Begin VB.Frame pop 
      BorderStyle     =   0  'None
      Caption         =   "Frame2"
      Height          =   1335
      Left            =   5040
      TabIndex        =   11
      Top             =   4080
      Visible         =   0   'False
      Width           =   5175
      Begin VB.CommandButton Command5 
         Caption         =   "Ok"
         Height          =   375
         Left            =   2160
         TabIndex        =   13
         Top             =   840
         Width           =   1335
      End
      Begin VB.Label popmsg 
         Caption         =   "Label7"
         Height          =   495
         Left            =   240
         TabIndex        =   12
         Top             =   120
         Width           =   4815
      End
   End
   Begin VB.PictureBox Picture1 
      Appearance      =   0  'Flat
      AutoSize        =   -1  'True
      BackColor       =   &H80000005&
      BorderStyle     =   0  'None
      ForeColor       =   &H80000008&
      Height          =   1980
      Left            =   5640
      Picture         =   "test.frx":315108
      ScaleHeight     =   1980
      ScaleWidth      =   4305
      TabIndex        =   0
      Top             =   3360
      Width           =   4305
   End
   Begin VB.Frame loginframe 
      BackColor       =   &H00004000&
      BorderStyle     =   0  'None
      Height          =   2055
      Left            =   4680
      TabIndex        =   1
      Top             =   7680
      Width           =   5895
      Begin VB.CommandButton Command4 
         Cancel          =   -1  'True
         Caption         =   "&Cancel"
         Height          =   375
         Left            =   120
         TabIndex        =   10
         Top             =   120
         Width           =   1575
      End
      Begin VB.CommandButton Command3 
         Caption         =   "&Go!"
         Default         =   -1  'True
         Height          =   375
         Left            =   120
         TabIndex        =   9
         Top             =   1560
         Width           =   1575
      End
      Begin VB.CommandButton Command2 
         Caption         =   "&View Stats"
         Height          =   375
         Left            =   120
         TabIndex        =   8
         Top             =   1080
         Width           =   1575
      End
      Begin VB.CommandButton Command1 
         Caption         =   "&New User"
         Height          =   375
         Left            =   120
         TabIndex        =   7
         Top             =   600
         Width           =   1575
      End
      Begin VB.TextBox pwBox 
         Height          =   375
         IMEMode         =   3  'DISABLE
         Left            =   2400
         PasswordChar    =   "P"
         TabIndex        =   3
         Top             =   1080
         Width           =   3015
      End
      Begin VB.TextBox idBox 
         Height          =   375
         Left            =   2400
         TabIndex        =   2
         Top             =   600
         Width           =   3015
      End
      Begin VB.Label Label6 
         Alignment       =   1  'Right Justify
         BackStyle       =   0  'Transparent
         Caption         =   "Login"
         BeginProperty Font 
            Name            =   "Times New Roman"
            Size            =   24
            Charset         =   0
            Weight          =   400
            Underline       =   0   'False
            Italic          =   0   'False
            Strikethrough   =   0   'False
         EndProperty
         ForeColor       =   &H0000FF00&
         Height          =   615
         Left            =   3480
         TabIndex        =   6
         Top             =   0
         Width           =   2055
      End
      Begin VB.Label Label5 
         Alignment       =   1  'Right Justify
         BackStyle       =   0  'Transparent
         Caption         =   "PW:  "
         BeginProperty Font 
            Name            =   "Times New Roman"
            Size            =   12
            Charset         =   0
            Weight          =   400
            Underline       =   0   'False
            Italic          =   0   'False
            Strikethrough   =   0   'False
         EndProperty
         ForeColor       =   &H000000FF&
         Height          =   495
         Left            =   1680
         TabIndex        =   5
         Top             =   1080
         Width           =   615
      End
      Begin VB.Label Label1 
         Alignment       =   1  'Right Justify
         BackStyle       =   0  'Transparent
         Caption         =   "ID:  "
         BeginProperty Font 
            Name            =   "Times New Roman"
            Size            =   12
            Charset         =   0
            Weight          =   400
            Underline       =   0   'False
            Italic          =   0   'False
            Strikethrough   =   0   'False
         EndProperty
         ForeColor       =   &H000000FF&
         Height          =   375
         Left            =   1560
         TabIndex        =   4
         Top             =   600
         Width           =   735
      End
   End
   Begin VB.PictureBox mofhof 
      AutoSize        =   -1  'True
      BorderStyle     =   0  'None
      Height          =   11520
      Left            =   0
      Picture         =   "test.frx":330ECA
      ScaleHeight     =   11520
      ScaleWidth      =   15360
      TabIndex        =   54
      Top             =   0
      Visible         =   0   'False
      Width           =   15360
      Begin VB.Label Label12 
         BackStyle       =   0  'Transparent
         BeginProperty Font 
            Name            =   "Arial"
            Size            =   15.75
            Charset         =   0
            Weight          =   400
            Underline       =   0   'False
            Italic          =   0   'False
            Strikethrough   =   0   'False
         EndProperty
         ForeColor       =   &H000000FF&
         Height          =   495
         Index           =   4
         Left            =   6840
         TabIndex        =   64
         Top             =   6360
         Width           =   2895
      End
      Begin VB.Label Label12 
         BackStyle       =   0  'Transparent
         BeginProperty Font 
            Name            =   "Arial"
            Size            =   15.75
            Charset         =   0
            Weight          =   400
            Underline       =   0   'False
            Italic          =   0   'False
            Strikethrough   =   0   'False
         EndProperty
         ForeColor       =   &H000000FF&
         Height          =   615
         Index           =   3
         Left            =   7560
         TabIndex        =   63
         Top             =   5640
         Width           =   2055
      End
      Begin VB.Label Label12 
         BackStyle       =   0  'Transparent
         BeginProperty Font 
            Name            =   "Arial"
            Size            =   15.75
            Charset         =   0
            Weight          =   400
            Underline       =   0   'False
            Italic          =   0   'False
            Strikethrough   =   0   'False
         EndProperty
         ForeColor       =   &H000000FF&
         Height          =   615
         Index           =   2
         Left            =   8040
         TabIndex        =   62
         Top             =   4920
         Width           =   1815
      End
      Begin VB.Label Label12 
         BackStyle       =   0  'Transparent
         BeginProperty Font 
            Name            =   "Arial"
            Size            =   15.75
            Charset         =   0
            Weight          =   400
            Underline       =   0   'False
            Italic          =   0   'False
            Strikethrough   =   0   'False
         EndProperty
         ForeColor       =   &H000000FF&
         Height          =   735
         Index           =   1
         Left            =   7080
         TabIndex        =   61
         Top             =   4080
         Width           =   2295
      End
      Begin VB.Label Label11 
         BackStyle       =   0  'Transparent
         Caption         =   "Coolest Guy"
         BeginProperty Font 
            Name            =   "Arial"
            Size            =   21.75
            Charset         =   0
            Weight          =   400
            Underline       =   0   'False
            Italic          =   0   'False
            Strikethrough   =   0   'False
         EndProperty
         ForeColor       =   &H000000FF&
         Height          =   615
         Index           =   4
         Left            =   4200
         TabIndex        =   60
         Top             =   6360
         Width           =   2895
      End
      Begin VB.Label Label11 
         BackStyle       =   0  'Transparent
         Caption         =   "No Life Award"
         BeginProperty Font 
            Name            =   "Arial"
            Size            =   24
            Charset         =   0
            Weight          =   400
            Underline       =   0   'False
            Italic          =   0   'False
            Strikethrough   =   0   'False
         EndProperty
         ForeColor       =   &H000000FF&
         Height          =   615
         Index           =   3
         Left            =   4320
         TabIndex        =   59
         Top             =   5640
         Width           =   3135
      End
      Begin VB.Label Label11 
         BackStyle       =   0  'Transparent
         Caption         =   "Levels Completed"
         BeginProperty Font 
            Name            =   "Arial"
            Size            =   21.75
            Charset         =   0
            Weight          =   400
            Underline       =   0   'False
            Italic          =   0   'False
            Strikethrough   =   0   'False
         EndProperty
         ForeColor       =   &H000000FF&
         Height          =   615
         Index           =   2
         Left            =   4200
         TabIndex        =   58
         Top             =   4920
         Width           =   3615
      End
      Begin VB.Label Label11 
         BackStyle       =   0  'Transparent
         Caption         =   "Best Shot"
         BeginProperty Font 
            Name            =   "Arial"
            Size            =   27.75
            Charset         =   0
            Weight          =   400
            Underline       =   0   'False
            Italic          =   0   'False
            Strikethrough   =   0   'False
         EndProperty
         ForeColor       =   &H000000FF&
         Height          =   615
         Index           =   1
         Left            =   4200
         TabIndex        =   57
         Top             =   4200
         Width           =   2415
      End
      Begin VB.Label Label12 
         BackStyle       =   0  'Transparent
         BeginProperty Font 
            Name            =   "Arial"
            Size            =   15.75
            Charset         =   0
            Weight          =   400
            Underline       =   0   'False
            Italic          =   0   'False
            Strikethrough   =   0   'False
         EndProperty
         ForeColor       =   &H000000FF&
         Height          =   735
         Index           =   0
         Left            =   6960
         TabIndex        =   56
         Top             =   3480
         Width           =   2295
      End
      Begin VB.Label Label11 
         BackStyle       =   0  'Transparent
         Caption         =   "Most Kills"
         BeginProperty Font 
            Name            =   "Arial"
            Size            =   27.75
            Charset         =   0
            Weight          =   400
            Underline       =   0   'False
            Italic          =   0   'False
            Strikethrough   =   0   'False
         EndProperty
         ForeColor       =   &H000000FF&
         Height          =   615
         Index           =   0
         Left            =   4200
         TabIndex        =   55
         Top             =   3480
         Width           =   2415
      End
   End
End
Attribute VB_Name = "Form2"
Attribute VB_GlobalNameSpace = False
Attribute VB_Creatable = False
Attribute VB_PredeclaredId = True
Attribute VB_Exposed = False
Dim mis1high As Boolean
Dim mis2high As Boolean
Dim mis3high As Boolean
Dim mis4high As Boolean
Dim scrolling As Boolean
Dim mmoder As Boolean
Dim ambmusic As Integer

Private Sub Command1_Click()
If pop.Visible = True Then Exit Sub
popup NewGuy(idBox.Text, pwBox.Text)

End Sub

Private Sub Command2_Click()
If pop.Visible = True Then Exit Sub
Dim jerk As String
 
jerk = LoadGuy(idBox.Text, pwBox.Text)
If jerk = "OK" Then
    Picture3.Visible = True
    
    On Error Resume Next
    Picture4.Picture = LoadPicture(App.Path + "\sprites\" + idBox.Text + ".bmp")
       If Err Then Picture4.Picture = LoadPicture(App.Path + "\sprites\face1.bmp")

    lblname = guy.name
    lblscore = Str$(guy.score)
    lblshots = Str$(guy.shots)
    lblhits = Str$(guy.hits)
    Dim high As Integer, loc As Integer, x As Integer
    high = 0
    loc = 0
    For x = 1 To MAXWEAPS
        If guy.favweap(x).shots > high Then
           high = guy.favweap(x).shots
           loc = x
        End If
     
     Next x
    Select Case loc
       Case Is = 1
          lblweap = "Pistol"
       Case Is = 2
          lblweap = "Shotgun"
       Case Is = 3
          lblweap = "Howitzer"
       Case Is = 4
          lblweap = "Machine Gun"
       Case Is = 5
          lblweap = "Fairy Mines"
       Case Is = 6
          lblweap = "Fairy Bus"
       Case Is = 7
          lblweap = "Ion O' Death"
       Case Is = 8
          lblweap = "Piano Man"
       Case Is = 9
          lblweap = "Black Hole"
       Case Else
          lblweap = "No Favorite"
    End Select
      lbllevels = Str$(guy.levelsplayed)
      If guy.shots <> 0 Then lblacc = Str$(Int(guy.hits / guy.shots * 100)) + "%"
      lblstreak = guy.longstreak
      
      List1.Clear
      x = 0
      While guy.KillFairy(x).shotcount > 0
         List1.AddItem pad(guy.KillFairy(x).shotcount, 5) + ":  " + guy.KillFairy(x).name
         x = x + 1
       Wend
Else
    popup jerk
End If
End Sub
Sub loadSettings()
Open App.Path + "\defaults.mof" For Input As #6
   Input #6, PlaySounds, PlayMusic, PlayAmbience, WeatherStuff
Close #6
End Sub

Function pad(s As Long, size As Integer) As String
Dim x As Integer
Dim t As String
t = Str$(s)
t = Right$(t, Len(t) - 1)
For x = 1 To size - Len(t)
  t = " " + t
Next x
pad = t
End Function
Private Sub Command3_Click()
Dim jerk As String
If mmoder = True Then
  jerk = LoadGuy(idBox.Text, pwBox.Text)
  If jerk = "OK" Then
   shutdown
   Unload Me
   GameMode = GM_MASSACRE
   Load mmode
   'Set mmode = Nothing
  End If
End If
If mmoder = False Then
  If pop.Visible = True Then Exit Sub
  jerk = LoadGuy(idBox.Text, pwBox.Text)
  If jerk = "OK" Then
     GameMode = GM_ADVENTURE
     For x = 0 To 3
        levpic(x).Visible = False
        levdisc(x).Visible = False
     Next x
     For x = 0 To guy.scenario
        levpic(x).Visible = True
        levdisc(x).Visible = True
     Next x
     roundsel.Visible = True
   Else
      popup jerk
   End If
End If
End Sub

Private Sub Command4_Click()
If pop.Visible Then Exit Sub
Picture8.Visible = True
loginframe.Visible = False
End Sub

Private Sub Command5_Click()
pop.Visible = False
End Sub


Private Sub Form_Load()
'Unload Form1

WeatherStuff = 1
loadSettings
sndcheck.Value = PlaySounds
musicchk.Value = PlayMusic
ambcheck.Value = PlayAmbience
weathchk.Value = WeatherStuff


pop.Visible = False
Picture8.Visible = True
loginframe.Visible = False
Form2.Picture = LoadPicture(App.Path + "\bg\bforrest.bmp")
 InitDSound
   ambmusic = RegisterSound("music2.wav", True)
  sndPlaySound (ambmusic)

init Me
End Sub
Private Sub popup(msg As String)
popmsg = msg
pop.Visible = True
End Sub

Private Sub Frame1_MouseMove(Button As Integer, Shift As Integer, x As Single, y As Single)
Label2.ForeColor = 0
Label4.ForeColor = 0
Label9.ForeColor = 0
Label3.ForeColor = 0
End Sub


Private Sub Form_Unload(Cancel As Integer)
General_StopSound (ambmusic)
End Sub

Private Sub Label13_MouseDown(Button As Integer, Shift As Integer, x As Single, y As Single)
GetHigh
mofhof.Visible = True
Picture8.Visible = False
Picture1.Visible = False
End Sub
Private Sub GetHigh()
   
 File1.Path = App.Path
 Dim x As Integer
 Dim mk_name$, bs_name$, lc_name$, nl_name$, be_name$
 Dim mk, bs, lc, nl, be
 
 For x = 0 To File1.ListCount - 1
    a$ = File1.List(x)
     a$ = Left$(a$, InStr(a$, ".") - 1)
     LoadGuy a$, "stop", False
     If guy.hits > mk Then
         mk_name$ = a$
         mk = guy.hits
     End If
     If guy.shots > 0 Then
        If guy.hits / guy.shots > bs Then
           bs = guy.hits / guy.shots
           bs_name$ = a$
        End If
     End If
     If guy.levelsplayed > be Then
        be = guy.levelsplayed
        be_name = a$
    End If
        
Next x
Label12(0) = mk_name$
Label12(1) = bs_name$
Label12(3) = be_name$

        
        
End Sub
Private Sub Label13_MouseMove(Button As Integer, Shift As Integer, x As Single, y As Single)
Label3.ForeColor = &H0
Label13.ForeColor = &HFFFFFF
Label4.ForeColor = &H0
Label2.ForeColor = 0
Label9.ForeColor = 0
End Sub

Private Sub Label2_MouseDown(Button As Integer, Shift As Integer, x As Single, y As Single)
mmoder = False
Picture8.Visible = False
loginframe.Visible = True
End Sub

Private Sub Label2_MouseMove(Button As Integer, Shift As Integer, x As Single, y As Single)
Label3.ForeColor = &H0
Label2.ForeColor = &HFFFFFF
Label4.ForeColor = &H0
Label13.ForeColor = 0
Label9.ForeColor = 0
End Sub
Private Sub Label3_MouseDown(Button As Integer, Shift As Integer, x As Single, y As Single)
   mmoder = True
   Picture8.Visible = False
   loginframe.Visible = True
End Sub

Private Sub Label3_MouseMove(Button As Integer, Shift As Integer, x As Single, y As Single)
Label3.ForeColor = &HFFFFFF
Label2.ForeColor = 0
Label9.ForeColor = 0
Label13.ForeColor = 0
Label4.ForeColor = 0
End Sub

Private Sub Label4_MouseMove(Button As Integer, Shift As Integer, x As Single, y As Single)
Label3.ForeColor = 0
Label2.ForeColor = 0
Label9.ForeColor = 0
Label4.ForeColor = &HFFFFFF
Label13.ForeColor = 0
End Sub

Private Sub Label4_Click()
Picture8.Visible = False
Picture1.Visible = False
Picture5.Visible = True
Picture5.Picture = LoadPicture(App.Path + "\full.bmp")
Picture5.Top = (Form2.height - Picture5.height) / 2
Picture5.Left = (Form2.width - Picture5.width) / 2
End Sub

Private Sub Label7_Click()
Picture3.Visible = False
End Sub

Private Sub Label9_MouseDown(Button As Integer, Shift As Integer, x As Single, y As Single)
optionspic.Visible = True
Picture8.Visible = False
End Sub

Private Sub Label9_MouseMove(Button As Integer, Shift As Integer, x As Single, y As Single)
Label3.ForeColor = 0
Label13.ForeColor = 0
Label9.ForeColor = &HFFFFFF
Label4.ForeColor = &H0
Label2.ForeColor = 0
End Sub

Private Sub levdisc_MouseMove(Index As Integer, Button As Integer, Shift As Integer, x As Single, y As Single)
levtitle(0).ForeColor = RGB(0, 0, 255)
levtitle(1).ForeColor = RGB(0, 0, 255)
levtitle(2).ForeColor = RGB(0, 0, 255)
levtitle(3).ForeColor = RGB(0, 0, 255)
End Sub

Private Sub levtitle_MouseDown(Index As Integer, Button As Integer, Shift As Integer, x As Single, y As Single)
shutdown
   Select Case Index
    Case Is = 0
      Unload Me
      gamemain.BeginGame "wild.txt"
      Unload gamemain
      Set gamemain = Nothing
      Load Me
    Case Is = 1
       Unload Me
       gamemain.BeginGame "des.txt"
       Unload gamemain
       Set gamemain = Nothing
       Load Me
    Case Is = 2
      Unload Me
       gamemain.BeginGame "snow.txt"
       Unload gamemain
       Set gamemain = Nothing
       Load Me
     Case Is = 3
       Unload Me
       gamemain.BeginGame "fland.txt"
       Unload gamemain
       Set gamemain = Nothing
       Load Me
    End Select
    
End Sub

Private Sub levtitle_MouseMove(Index As Integer, Button As Integer, Shift As Integer, x As Single, y As Single)
Select Case Index
  Case Is = 0
    mis1high = True
    mis2high = False
    mis3high = False
    mis4high = False
    checkmis
  Case Is = 1
    mis1high = False
    mis2high = True
    mis3high = False
    mis4high = False
    checkmis
  Case Is = 2
    mis1high = False
    mis2high = False
    mis3high = True
    mis4high = False
    checkmis
   Case Is = 3
    mis1high = False
    mis2high = False
    mis3high = False
    mis4high = True
    checkmis
    End Select
End Sub


Private Sub mofhof_Click()
Picture8.Visible = True
Picture1.Visible = True
mofhof.Visible = False
End Sub

Private Sub OptionsOk_Click()
optionspic.Visible = False
PlaySounds = sndcheck
PlayMusic = musicchk
PlayAmbience = ambcheck
WeatherStuff = weathchk
Picture8.Visible = True
End Sub

Private Sub Picture5_Click()
Open App.Path + "\defaults.mof" For Output As #5
   Write #5, PlaySounds, PlayMusic, PlayAmbience, WeatherStuff
Close #5
shutdown
End
End Sub

Sub checkmis()
If mis1high = True Then
   levtitle(0).ForeColor = RGB(0, 225, 54)
   levtitle(1).ForeColor = RGB(0, 0, 255)
   levtitle(2).ForeColor = RGB(0, 0, 255)
   levtitle(3).ForeColor = RGB(0, 0, 255)
  Else
    If mis2high = True Then
     levtitle(1).ForeColor = RGB(0, 225, 54)
     levtitle(0).ForeColor = RGB(0, 0, 255)
     levtitle(2).ForeColor = RGB(0, 0, 255)
     levtitle(3).ForeColor = RGB(0, 0, 255)
   Else
     If mis3high = True Then
      levtitle(2).ForeColor = RGB(0, 225, 54)
      levtitle(0).ForeColor = RGB(0, 0, 255)
      levtitle(1).ForeColor = RGB(0, 0, 255)
      levtitle(3).ForeColor = RGB(0, 0, 255)
   Else
     If mis4high = True Then
      levtitle(3).ForeColor = RGB(0, 225, 54)
      levtitle(0).ForeColor = RGB(0, 0, 255)
      levtitle(1).ForeColor = RGB(0, 0, 255)
      levtitle(2).ForeColor = RGB(0, 0, 255)
   Else
    levtitle(0).ForeColor = RGB(0, 0, 255)
    levtitle(1).ForeColor = RGB(0, 0, 255)
    levtitle(2).ForeColor = RGB(0, 0, 255)
End If
End If
End If
End If
End Sub

Private Sub Picture6_DblClick()
scrolling = False
End Sub

Private Sub Picture6_LostFocus()
scrolling = False
End Sub

Private Sub Picture6_MouseDown(Button As Integer, Shift As Integer, x As Single, y As Single)

Static bob
While scrolling = True

Wend
End Sub

Private Sub Picture6_MouseUp(Button As Integer, Shift As Integer, x As Single, y As Single)
scrolling = False
End Sub

Private Sub Picture7_DblClick()
scrolling = False
End Sub

Private Sub Picture7_LostFocus()
scrolling = False
End Sub

Private Sub Picture8_MouseMove(Button As Integer, Shift As Integer, x As Single, y As Single)
Label3.ForeColor = &H0
Label9.ForeColor = 0
Label4.ForeColor = &H0
Label2.ForeColor = 0
End Sub

Private Sub ronselcancel_Click()
roundsel.Visible = False

End Sub


Private Sub ronselcancel_MouseUp(Button As Integer, Shift As Integer, x As Single, y As Single)
scrolling = False
End Sub

Private Sub roundsel_MouseMove(Button As Integer, Shift As Integer, x As Single, y As Single)
mis1high = False
mis2high = False
mis3high = False
mis4high = False
checkmis
End Sub

Private Sub VScroll1_Change()
 For bob = 0 To 2
    levdisc(bob).Top = (720 + bob * 1250) - VScroll1.Value
    levpic(bob).Top = (720 + bob * 1250) - VScroll1.Value
 Next bob
End Sub
