Attribute VB_Name = "DSound"
Option Explicit

'Dim DX As New DirectX7
Dim DSound As DirectSound
Dim dsbuffdesc As DSBUFFERDESC
Public DSBuff(50) As DirectSoundBuffer

Dim Looper(50) As Boolean 'array if it should loop when played
Dim buffcount As Integer
Dim DSWaveH As WAVEFORMATEX
Dim DSWaveM As WAVEFORMATEX
Dim DSWaveL As WAVEFORMATEX

Public Sub InitDSound()
    Set DSound = dx7.DirectSoundCreate("")
    If Err.Number <> 0 Then
        MsgBox "Error creating DirectSound object"
        Exit Sub
    End If
    
    DSound.SetCooperativeLevel gamemain.hWnd, DSSCL_PRIORITY

    dsbuffdesc.lFlags = DSBCAPS_CTRLFREQUENCY Or DSBCAPS_CTRLPAN Or DSBCAPS_CTRLVOLUME Or DSBCAPS_STATIC
    DSWaveH.nFormatTag = WAVE_FORMAT_PCM
    DSWaveH.nChannels = 2
    DSWaveH.lSamplesPerSec = 44100
    DSWaveH.nBitsPerSample = 16
    DSWaveH.nBlockAlign = DSWaveH.nBitsPerSample / 8 * DSWaveH.nChannels
    DSWaveH.lAvgBytesPerSec = DSWaveH.lSamplesPerSec * DSWaveH.nBlockAlign
    
    DSWaveM.nFormatTag = WAVE_FORMAT_PCM
    DSWaveM.nChannels = 2
    DSWaveM.lSamplesPerSec = 22050
    DSWaveM.nBitsPerSample = 16
    DSWaveM.nBlockAlign = DSWaveM.nBitsPerSample / 8 * DSWaveM.nChannels
    DSWaveM.lAvgBytesPerSec = DSWaveM.lSamplesPerSec * DSWaveM.nBlockAlign
    
    DSWaveL.nFormatTag = WAVE_FORMAT_PCM
    DSWaveL.nChannels = 1
    DSWaveL.lSamplesPerSec = 22050
    DSWaveL.nBitsPerSample = 8
    DSWaveL.nBlockAlign = DSWaveL.nBitsPerSample / 8 * DSWaveL.nChannels
    DSWaveL.lAvgBytesPerSec = DSWaveL.lSamplesPerSec * DSWaveL.nBlockAlign
  
End Sub

Public Function General_LoadStaticSound(fname As String, streaming As Boolean) As Integer
buffcount = buffcount + 1
Dim dsbdesc As DSBUFFERDESC
dsbdesc.lFlags = DSBCAPS_CTRLPAN Or DSBCAPS_CTRLVOLUME Or DSBCAPS_STATIC
Set DSBuff(buffcount) = DSound.CreateSoundBufferFromFile(fname, dsbdesc, DSWaveL)
Looper(buffcount) = streaming
General_LoadStaticSound = buffcount
End Function
Public Sub General_StopSound(wdex As Integer)
DSBuff(wdex).Stop
DSBuff(wdex).SetCurrentPosition 0
End Sub
Public Sub Init_UninitializeDirectSound()
Dim wdex
For wdex = 1 To buffcount
DSBuff(wdex).Stop
DSBuff(wdex).SetCurrentPosition 0
' dsbuff(wdex) = nothing
Next wdex
buffcount = 0
End Sub
Public Sub General_PlaySound(wdex As Integer, Optional pan As Integer)
'converts the x coordinate to a stereo panning position
'Dim dtemp As DirectSoundBuffer

Dim fryingpan As Long
If pan < 512 And pan > 0 Then fryingpan = ((512 - pan) * -1)
If pan > 512 And pan < 0 Then fryingpan = (pan - 512)

If pan = 0 Then
    fryingpan = DSBuff(wdex).GetPan
Else
   fryingpan = fryingpan * 19 'scale the screen to stereo values
End If

If Looper(wdex) Then
    DSBuff(wdex).Play (DSBPLAY_LOOPING)

Else
   DSBuff(wdex).SetPan fryingpan 'set the panning - for left, + for right
   
   If DSBuff(wdex).GetStatus = DSBSTATUS_PLAYING Then
        DSBuff(wdex).SetCurrentPosition (0)
        End If
       DSBuff(wdex).Play (DSBPLAY_DEFAULT)
       
  ' End If
   'DSBuff(wdex).SetPan 0 ' reset it to center
End If
End Sub



