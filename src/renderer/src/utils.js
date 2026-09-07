export const getSongName = (p) => {
  // console.log(p)
  let splits = p.split('/')
  const filename = splits[splits.length - 1]
  let res = ''
  splits = filename.split('.')
  splits.map((elt, idx) => {
    if (idx + 1 < splits.length) {
      res += elt
    }
  })
  return res
}

export const toSearchString = (s) => {
  return s.toLocaleLowerCase().replaceAll(' ', '')
}

export const getSortedFiles = async (f) => {
  const t = await window.electron.ipcRenderer.invoke('sort_created', {
    files: f.filter((elt) => isMusicFile(elt))
  })
  // [ { Hybrid Theory/Pushing Me Away - Linkin Park.mp3: {mtimeMs: 1787336506, atimeMs: 648301400} } ]
  let timed = t.map((elt) => {
    const key = Object.keys(elt)[0]
    return {
      path: key,
      created: elt[key].mtimeMs
    }
  })
  timed = timed.toSorted((a, b) => a.created - b.created)
  const songs = timed.map((elt) => elt.path)

  return { songs, timed }
}

export const getSortedFilesAt = async (p, filterMusicFiles = false) => {
  const t = await window.electron.ipcRenderer.invoke('ls_sorted', {
    path: p
  })
  // [ { Hybrid Theory/Pushing Me Away - Linkin Park.mp3: {mtimeMs: 1787336506, atimeMs: 648301400} } ]
  let timed = t.map((elt) => {
    const key = Object.keys(elt)[0]
    return {
      path: key,
      created: elt[key].mtimeMs
    }
  })
  timed = timed.toSorted((a, b) => a.created - b.created).filter((elt) => filterMusicFiles ? isMusicFile(elt.path) : true)
  const songs = timed.map((elt) => elt.path).filter((elt) => filterMusicFiles ? isMusicFile(elt) : true)

  return { songs, timed }
}

export const handleDropped = async (paths) => {
  if (!paths) return
  const potentialDirs = []
  const dirs = []
  let songs = paths.filter((v) => isMusicFile(v))
  paths.map((elt) => {
    if (!songs.includes(elt)) {
      potentialDirs.push(elt)
    }
  })
  // console.log(`songs: ${songs}`)
  for (let v of potentialDirs) {
    const isdir = await window.electron.ipcRenderer.invoke('is_dir', {
      path: v
    })
    if (isdir) {
      dirs.push(v)
      // console.log(`${v} is directory !`)
    }
  }
  for (let elt of dirs) {
    const ls = await window.electron.ipcRenderer.invoke('ls', { path: elt })
    // console.log(ls)
    const { songs: files } = await getSortedFiles(ls)
    songs = [...songs, ...files]
  }
  return songs
}

export const getFolderName = (p) => {
  if (!p) return
  let splits = p.split('/')
  if (isMusicFile(p)) {
    return splits[splits.length - 2]
  } else {
    return splits[splits.length - 1]
  }
}

export const isMusicFile = (file) => {
  const formats = ['.mp3', '.wav', '.ogg', '.flac']
  for (let i of formats) {
    if (file.endsWith(i)) {
      return true
    }
  }
  return false
}

export const shuffleArray = (array) => {
  return array
    .map((value) => ({ value, sort: Math.random() }))
    .sort((a, b) => a.sort - b.sort)
    .map(({ value }) => value)
}

export const toMinsSecs = (t) => {
  t = parseInt(t)
  let hours = parseInt(t / 3600)
  let mins = parseInt(t / 60) - hours * 60
  let secs = parseInt(t) - (mins * 60 + hours * 3600)
  return `${hours > 0 ? parseInt(hours).toString().padStart(2, '0') + ':' : ''}${parseInt(mins)
    .toString()
    .padStart(hours > 0 ? 2 : 1, '0')}:${parseInt(secs).toString().padStart(2, '0')}`
}

export const uiVolume2Volume = (v) => {
  return parseFloat(Math.pow(v, 1.5))
}
