// js/app.js
document.addEventListener('DOMContentLoaded', async () => {
    // --- 1. 變數與初始化 ---
    let audio = new Audio();
    let audioCtx = null;
    let analyser = null;
    let source = null;
    let playlist = [];
    let currentIndex = 0;
    let isPlaying = false;
    let isShuffle = false;
    let repeatMode = 0; // 0: none, 1: all, 2: one

    // --- 2. DOM 元素獲取 ---
    const elements = {
        playBtn: document.getElementById('playBtn'),
        playIcon: document.getElementById('playIcon'),
        prevBtn: document.getElementById('prevBtn'),
        nextBtn: document.getElementById('nextBtn'),
        shuffleBtn: document.getElementById('shuffleBtn'),
        repeatBtn: document.getElementById('repeatBtn'),
        progressBar: document.getElementById('progressBar'),
        currentTime: document.getElementById('currentTime'),
        totalTime: document.getElementById('totalTime'),
        volumeBar: document.getElementById('volumeBar'),
        muteBtn: document.getElementById('muteBtn'),
        volumeIcon: document.getElementById('volumeIcon'),
        songTitle: document.getElementById('songTitle'),
        artistName: document.getElementById('artistName'),
        albumCoverImg: document.getElementById('albumCoverImg'),
        defaultCoverIcon: document.getElementById('defaultCoverIcon'),
        vinylDisk: document.getElementById('vinylDisk'),
        spectrumCanvas: document.getElementById('spectrumCanvas'),
        uploadBtn: document.getElementById('uploadBtn'),
        drawerUploadBtn: document.getElementById('drawerUploadBtn'),
        audioFileInput: document.getElementById('audioFileInput'),
        playlistToggle: document.getElementById('playlistToggle'),
        playlistDrawer: document.getElementById('playlistDrawer'),
        playlistContainer: document.getElementById('playlistContainer'),
        themeToggle: document.getElementById('themeToggle'),
        themeIcon: document.getElementById('themeIcon'),
        fullscreenBtn: document.getElementById('fullscreenBtn')
    };

    // --- 3. 綁定基本 UI 互動事件 (確保按鈕一定有作用) ---
    
    // 檔案上傳觸發
    const triggerUpload = () => elements.audioFileInput.click();
    elements.uploadBtn.addEventListener('click', triggerUpload);
    elements.drawerUploadBtn.addEventListener('click', triggerUpload);

    // 播放清單側邊欄切換
    elements.playlistToggle.addEventListener('click', () => {
        const drawer = elements.playlistDrawer;
        if (drawer.classList.contains('w-0')) {
            drawer.classList.remove('w-0', 'opacity-0');
            drawer.classList.add('w-full', 'md:w-80', 'opacity-100');
        } else {
            drawer.classList.add('w-0', 'opacity-0');
            drawer.classList.remove('w-full', 'md:w-80', 'opacity-100');
        }
    });

    // 主題切換 (Dark/Light)
    elements.themeToggle.addEventListener('click', () => {
        document.documentElement.classList.toggle('dark');
        if(document.documentElement.classList.contains('dark')){
            elements.themeIcon.className = 'fa-solid fa-sun text-amber-400';
        } else {
            elements.themeIcon.className = 'fa-solid fa-moon text-indigo-500';
        }
    });

    // 全螢幕功能
    elements.fullscreenBtn.addEventListener('click', () => {
        if (!document.fullscreenElement) {
            document.documentElement.requestFullscreen().catch(err => {
                console.log(`全螢幕錯誤: ${err.message}`);
            });
        } else {
            document.exitFullscreen();
        }
    });

    // --- 3.5. 鍵盤快速鍵支援 (平板鍵鼠操作優化) ---
    document.addEventListener('keydown', (event) => {
        // 如果使用者正在輸入框或文字區域打字，不觸發快捷鍵
        if (event.target.tagName === 'INPUT' || event.target.tagName === 'TEXTAREA') {
            return;
        }

        switch (event.code) {
            case 'Space': // 空白鍵：播放 / 暫停
                event.preventDefault();
                togglePlay();
                break;

            case 'ArrowRight': // 右方向鍵：快進 5 秒
                event.preventDefault();
                if (audio.duration) {
                    audio.currentTime = Math.min(audio.duration, audio.currentTime + 5);
                }
                break;

            case 'ArrowLeft': // 左方向鍵：快退 5 秒
                event.preventDefault();
                audio.currentTime = Math.max(0, audio.currentTime - 5);
                break;

            case 'ArrowUp': // 上方向鍵：增加音量 (+5%)
                event.preventDefault();
                audio.volume = Math.min(1, audio.volume + 0.05);
                elements.volumeBar.value = audio.volume * 100;
                audio.muted = false;
                updateVolumeIcon();
                break;

            case 'ArrowDown': // 下方向鍵：減少音量 (-5%)
                event.preventDefault();
                audio.volume = Math.max(0, audio.volume - 0.05);
                elements.volumeBar.value = audio.volume * 100;
                updateVolumeIcon();
                break;
                
            case 'KeyM': // M 鍵：靜音切換
                event.preventDefault();
                audio.muted = !audio.muted;
                updateVolumeIcon();
                break;
        }
    });

    // --- 4. 音訊上下文與頻譜 (Web Audio API) ---
    const initAudioContext = () => {
        if (!audioCtx) {
            audioCtx = new (window.AudioContext || window.webkitAudioContext)();
            analyser = audioCtx.createAnalyser();
            analyser.fftSize = 256;
            source = audioCtx.createMediaElementSource(audio);
            source.connect(analyser);
            analyser.connect(audioCtx.destination);
            drawSpectrum();
        }
        if (audioCtx.state === 'suspended') audioCtx.resume();
    };

    const drawSpectrum = () => {
        const canvas = elements.spectrumCanvas;
        const ctx = canvas.getContext('2d');
        canvas.width = canvas.clientWidth;
        canvas.height = canvas.clientHeight;

        const bufferLength = analyser.frequencyBinCount;
        const dataArray = new Uint8Array(bufferLength);
        const barWidth = (canvas.width / bufferLength) * 2.5;
        let barHeight;
        let x = 0;

        const renderFrame = () => {
            requestAnimationFrame(renderFrame);
            x = 0;
            analyser.getByteFrequencyData(dataArray);
            ctx.clearRect(0, 0, canvas.width, canvas.height);

            for (let i = 0; i < bufferLength; i++) {
                barHeight = dataArray[i] / 2.5;
                const r = barHeight + (25 * (i / bufferLength));
                const g = 100 * (i / bufferLength);
                const b = 250;
                ctx.fillStyle = `rgb(${r},${g},${b})`;
                ctx.fillRect(x, canvas.height - barHeight, barWidth, barHeight);
                x += barWidth + 1;
            }
        };
        renderFrame();
    };

    // --- 5. 音樂控制與邏輯 ---
    const loadSong = (index) => {
        if (playlist.length === 0) return;
        const song = playlist[index];
        const blobUrl = URL.createObjectURL(song.file);
        audio.src = blobUrl;
        
        elements.songTitle.textContent = song.title;
        elements.artistName.textContent = song.artist;
        if (song.cover) {
            elements.albumCoverImg.src = song.cover;
            elements.albumCoverImg.classList.remove('hidden');
            elements.defaultCoverIcon.classList.add('hidden');
        } else {
            elements.albumCoverImg.classList.add('hidden');
            elements.defaultCoverIcon.classList.remove('hidden');
        }
        
        // 更新清單 UI
        document.querySelectorAll('.playlist-item').forEach((el, i) => {
            el.classList.toggle('bg-indigo-500/20', i === index);
            el.classList.toggle('border-indigo-500/50', i === index);
        });
    };

    const togglePlay = () => {
        if (playlist.length === 0) return;
        initAudioContext();
        if (audio.paused) {
            audio.play();
            isPlaying = true;
            elements.playIcon.className = 'fa-solid fa-pause';
            elements.vinylDisk.classList.remove('vinyl-paused');
        } else {
            audio.pause();
            isPlaying = false;
            elements.playIcon.className = 'fa-solid fa-play ml-0.5';
            elements.vinylDisk.classList.add('vinyl-paused');
        }
    };

    const playNext = () => {
        if (isShuffle) {
            currentIndex = Math.floor(Math.random() * playlist.length);
        } else {
            currentIndex = (currentIndex + 1) % playlist.length;
        }
        loadSong(currentIndex);
        if (isPlaying) audio.play();
    };

    const playPrev = () => {
        currentIndex = (currentIndex - 1 + playlist.length) % playlist.length;
        loadSong(currentIndex);
        if (isPlaying) audio.play();
    };

    elements.playBtn.addEventListener('click', togglePlay);
    elements.nextBtn.addEventListener('click', playNext);
    elements.prevBtn.addEventListener('click', playPrev);

    elements.shuffleBtn.addEventListener('click', () => {
        isShuffle = !isShuffle;
        elements.shuffleBtn.classList.toggle('text-indigo-600', isShuffle);
    });

    elements.repeatBtn.addEventListener('click', () => {
        repeatMode = (repeatMode + 1) % 3;
        const icons = ['fa-repeat', 'fa-repeat', 'fa-repeat-1'];
        elements.repeatBtn.innerHTML = `<i class="fa-solid ${icons[repeatMode]}"></i>`;
        elements.repeatBtn.classList.toggle('text-indigo-600', repeatMode > 0);
    });

    const formatTime = (seconds) => {
        if (isNaN(seconds)) return "0:00";
        const m = Math.floor(seconds / 60);
        const s = Math.floor(seconds % 60);
        return `${m}:${s < 10 ? '0' : ''}${s}`;
    };

    audio.addEventListener('timeupdate', () => {
        const p = (audio.currentTime / audio.duration) * 100;
        elements.progressBar.value = p || 0;
        elements.currentTime.textContent = formatTime(audio.currentTime);
    });

    audio.addEventListener('loadedmetadata', () => {
        elements.totalTime.textContent = formatTime(audio.duration);
    });

    audio.addEventListener('ended', () => {
        if (repeatMode === 2) {
            audio.currentTime = 0;
            audio.play();
        } else if (repeatMode === 1 || currentIndex < playlist.length - 1 || isShuffle) {
            playNext();
        } else {
            isPlaying = false;
            elements.playIcon.className = 'fa-solid fa-play ml-0.5';
            elements.vinylDisk.classList.add('vinyl-paused');
        }
    });

    elements.progressBar.addEventListener('input', (e) => {
        const time = (e.target.value / 100) * audio.duration;
        audio.currentTime = time;
    });

    elements.volumeBar.addEventListener('input', (e) => {
        audio.volume = e.target.value / 100;
        audio.muted = audio.volume === 0;
        updateVolumeIcon();
    });

    elements.muteBtn.addEventListener('click', () => {
        audio.muted = !audio.muted;
        updateVolumeIcon();
    });

    const updateVolumeIcon = () => {
        if (audio.muted || audio.volume === 0) elements.volumeIcon.className = 'fa-solid fa-volume-xmark text-xs';
        else if (audio.volume < 0.5) elements.volumeIcon.className = 'fa-solid fa-volume-low text-xs';
        else elements.volumeIcon.className = 'fa-solid fa-volume-high text-xs';
    };

    // --- 6. 檔案解析與 UI 渲染 ---
    elements.audioFileInput.addEventListener('change', async (e) => {
        const files = Array.from(e.target.files);
        for (const file of files) {
            if (!file.type.startsWith('audio/')) continue;
            const meta = await metadataModule.extractMetadata(file);
            const songData = {
                id: Date.now().toString() + Math.random().toString(36).substring(7),
                file: file,
                title: meta.title,
                artist: meta.artist,
                cover: meta.cover
            };
            
            try {
                await dbModule.saveSong(songData); // 嘗試存進資料庫
            } catch (err) {
                console.warn("無法儲存至資料庫，但仍會加入當前播放清單:", err);
            }
            
            playlist.push(songData);
        }
        renderPlaylist();
        if (playlist.length > 0 && currentIndex === 0 && !isPlaying && !audio.src) {
            loadSong(0);
        }
    });

    function renderPlaylist() {
        elements.playlistContainer.innerHTML = '';
        playlist.forEach((song, index) => {
            const div = document.createElement('div');
            div.className = 'playlist-item flex items-center justify-between p-2 rounded-xl hover:bg-black/5 dark:hover:bg-white/5 cursor-pointer transition border border-transparent text-sm';
            div.innerHTML = `
                <div class="flex items-center gap-3 overflow-hidden">
                    <div class="w-8 h-8 rounded-md bg-indigo-500/20 flex-shrink-0 flex items-center justify-center overflow-hidden">
                        ${song.cover ? `<img src="${song.cover}" class="w-full h-full object-cover">` : `<i class="fa-solid fa-music text-[10px] text-indigo-500"></i>`}
                    </div>
                    <div class="truncate">
                        <div class="font-medium text-zinc-800 dark:text-zinc-200 truncate text-xs">${song.title}</div>
                        <div class="text-[10px] text-zinc-500 truncate">${song.artist}</div>
                    </div>
                </div>
                <button class="delete-btn text-zinc-400 hover:text-red-500 p-1"><i class="fa-solid fa-trash text-[10px]"></i></button>
            `;
            
            div.addEventListener('click', (e) => {
                if (e.target.closest('.delete-btn')) return;
                currentIndex = index;
                loadSong(currentIndex);
                initAudioContext();
                audio.play();
                isPlaying = true;
                elements.playIcon.className = 'fa-solid fa-pause';
                elements.vinylDisk.classList.remove('vinyl-paused');
            });
            
            div.querySelector('.delete-btn').addEventListener('click', async () => {
                try {
                    await dbModule.deleteSong(song.id);
                } catch (err) {
                    console.warn("無法從資料庫刪除，僅從畫面移除:", err);
                }
                playlist.splice(index, 1);
                renderPlaylist();
            });

            elements.playlistContainer.appendChild(div);
        });
    }

    // --- 7. 最後再安全地載入本地資料庫 ---
    try {
        await dbModule.initDB();
        playlist = await dbModule.getAllSongs() || [];
        renderPlaylist();
        if (playlist.length > 0) loadSong(0);
    } catch (error) {
        console.warn("IndexedDB 初始化失敗，您的音樂可能無法在下次開啟時保留。", error);
    }
});
