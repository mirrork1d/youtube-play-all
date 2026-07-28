// ==UserScript==
// @name         YouTube Play All (Oldest) Channel Videos
// @namespace    http://tampermonkey.net/
// @version      1.0.3
// @description  Adds Play All button to channel videos page that works with filtering chips. Run with Tamper- or Greasymonkey. Happy listening.
// @author       summerinpalma
// @match        https://www.youtube.com/@*
// @match        https://www.youtube.com/c/*
// @match        https://www.youtube.com/user/*
// @match        https://www.youtube.com/channel/*
// @grant        none
// @license      MIT
// ==/UserScript==
 
(function() {
    'use strict';
 
    function injectStyles() {
        if (document.getElementById('yt-rainbow-btn-style')) return;
 
        // Modern Cyber/Neon Gradient for Play Buttons
        const pGradient = "linear-gradient(135deg, #7928CA, #FF0080, #00DFD8, #7928CA)";
 
        // Complementary Modern Slate/Midnight Gradient for Scroll Indicator Button
        const sGradient = "linear-gradient(135deg, #0F172A, #3B82F6, #1E1B4B, #0F172A)";
 
        const cssRules = `
            @keyframes animatedGradient {
                0% { background-position: 0% 50%; }
                50% { background-position: 100% 50%; }
                100% { background-position: 0% 50%; }
            }
            .rainbow-batch-container {
                display: inline-flex !important;
                align-items: center !important;
                gap: 8px !important;
                margin-left: 12px !important;
                padding-right: 12px !important;
                z-index: 1 !important; /* Reduced from 9999 so YouTube search box overlay renders on top */
                overflow: visible !important;
            }
            .rainbow-gradient-btn {
                background: ${pGradient} !important;
                background-size: 300% 300% !important;
                animation: animatedGradient 3s ease infinite !important;
                color: #ffffff !important;
                border: none !important;
                padding: 0 14px !important;
                border-radius: 18px !important;
                font-weight: 600 !important;
                font-size: 13px !important;
                cursor: pointer !important;
                box-shadow: 0px 4px 12px rgba(121, 40, 202, 0.35);
                transition: transform 0.2s ease, box-shadow 0.2s ease;
                height: 32px !important;
                line-height: 32px !important;
                box-sizing: border-box !important;
                white-space: nowrap;
                display: inline-flex !important;
                align-items: center !important;
                justify-content: center !important;
            }
            .rainbow-gradient-btn:last-child {
                margin-right: 12px !important;
            }
            .rainbow-gradient-btn:hover {
                transform: scale(1.05);
                box-shadow: 0px 6px 16px rgba(255, 0, 128, 0.45);
            }
            .yt-scroll-indicator-btn {
                background: ${sGradient} !important;
                background-size: 300% 300% !important;
                animation: animatedGradient 3s ease infinite !important;
                color: #ffffff !important;
                border: 1px solid rgba(255, 255, 255, 0.15) !important;
                padding: 0 14px !important;
                border-radius: 18px !important;
                font-weight: 600 !important;
                font-size: 13px !important;
                height: 32px !important;
                line-height: 32px !important;
                box-sizing: border-box !important;
                white-space: nowrap;
                cursor: default !important;
                pointer-events: none !important;
                box-shadow: 0px 4px 10px rgba(0, 0, 0, 0.3);
                display: inline-flex !important;
                align-items: center !important;
                justify-content: center !important;
            }
        `;
 
        const style = document.createElement('style');
        style.id = 'yt-rainbow-btn-style';
        style.appendChild(document.createTextNode(cssRules));
        (document.head || document.documentElement).appendChild(style);
    }
 
    function getAllCollectedVideoIds() {
        let links = Array.from(document.querySelectorAll('a[href*="/watch?v="]')).map(a => a.href);
        return Array.from(new Set(links.map(h => {
            try { return new URL(h).searchParams.get('v'); } catch(e) { return null; }
        }))).filter(Boolean);
    }
 
    function getChannelPrefix() {
        let channelHeader = document.querySelector('yt-page-header-renderer') || document.querySelector('ytd-channel-name');
        let channelName = channelHeader ? channelHeader.textContent.trim() : '';
 
        if (!channelName) {
            let parts = window.location.pathname.split('/');
            channelName = parts.find(p => p.startsWith('@')) || 'YouTube';
            channelName = channelName.replace('@', '');
        }
 
        let cleanName = channelName.replace(/[^a-zA-Z0-9]/g, '').toUpperCase();
        return cleanName.substring(0, 3) || 'YT';
    }
 
    function playBatch(startIndex, rangeText) {
        let ids = getAllCollectedVideoIds();
        let batch = ids.slice(startIndex, startIndex + 50);
 
        if (batch.length === 0) {
            alert('No videos found in this batch! Scroll down to load more.');
            return;
        }
 
        let prefix = getChannelPrefix();
        let playlistTitle = encodeURIComponent(`${prefix} ${rangeText}`);
        let playlistUrl = `https://www.youtube.com/watch_videos?video_ids=${batch.join(',')}&title=${playlistTitle}`;
 
        window.open(playlistUrl, '_blank');
    }
 
    function updateButtons() {
        let wrapper = document.getElementById('yt-batch-wrapper');

        // Check if current page path belongs to a channel's /videos tab
        let isVideosTab = window.location.pathname.includes('/videos');

        if (!isVideosTab) {
            if (wrapper) wrapper.remove(); // Clean up buttons if navigated to Home, Shorts, or Playlists tab
            return;
        }
 
        let container = document.querySelector('chip-bar-view-model') ||
                        document.querySelector('.ytChipBarViewModelHost') ||
                        document.querySelector('ytd-feed-filter-chip-bar-renderer');
 
        if (!container) return;
 
        injectStyles();
 
        if (!wrapper) {
            wrapper = document.createElement('div');
            wrapper.id = 'yt-batch-wrapper';
            wrapper.className = 'rainbow-batch-container';
 
            let scrollArea = container.querySelector('.ytChipBarViewModelChipBarScrollContainer') || container;
            scrollArea.appendChild(wrapper);
        }
 
        let ids = getAllCollectedVideoIds();
        let totalCount = ids.length;
 
        wrapper.textContent = '';
 
        let infoBtn = document.createElement('div');
        infoBtn.className = 'yt-scroll-indicator-btn';
        infoBtn.textContent = `Scroll Down To Load (${totalCount} found)`;
        wrapper.appendChild(infoBtn);
 
        let numberOfBatches = Math.max(1, Math.ceil(totalCount / 50));
        for (let i = 0; i < numberOfBatches; i++) {
            let start = i * 50;
            let end = Math.min((i + 1) * 50, totalCount);
            let rangeText = `${start + 1}-${end}`;
 
            let btn = document.createElement('button');
            btn.className = 'rainbow-gradient-btn';
            btn.textContent = `▶ Play ${rangeText}`;
            btn.onclick = function(e) {
                e.preventDefault();
                playBatch(start, rangeText);
            };
            wrapper.appendChild(btn);
        }
    }
 
    setInterval(updateButtons, 1200);
})();
