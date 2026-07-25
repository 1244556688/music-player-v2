// js/metadata.js
const extractMetadata = (file) => {
    return new Promise((resolve) => {
        jsmediatags.read(file, {
            onSuccess: function(tag) {
                const tags = tag.tags;
                let coverUrl = null;
                
                if (tags.picture) {
                    const data = tags.picture.data;
                    const format = tags.picture.format;
                    let base64String = "";
                    for (let i = 0; i < data.length; i++) {
                        base64String += String.fromCharCode(data[i]);
                    }
                    coverUrl = `data:${format};base64,${window.btoa(base64String)}`;
                }

                resolve({
                    title: tags.title || file.name.replace(/\.[^/.]+$/, ""),
                    artist: tags.artist || "未知藝術家",
                    cover: coverUrl
                });
            },
            onError: function() {
                resolve({
                    title: file.name.replace(/\.[^/.]+$/, ""),
                    artist: "未知藝術家",
                    cover: null
                });
            }
        });
    });
};

window.metadataModule = { extractMetadata };
