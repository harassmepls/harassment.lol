document.addEventListener('DOMContentLoaded', function() {
    const CONFIG = {
        DISCORD_USER_ID: '1404732292412477531',
        SPOTIFY_CLIENT_ID: 'e087c7926f31424187af19ffa5ccb97c',
        DISCORD_BOT_TOKEN: null,
        UPDATE_INTERVAL: 30000, 
        SPOTIFY_UPDATE_INTERVAL: 10000 
    };

    
    function checkRequiredElements() {
        const ids = ['main-avatar', 'discord-avatar', 'discord-username', 'discord-status', 'discord-activity', 'spotify-track', 'spotify-artist', 'spotify-album', 'last-seen'];
        const classes = ['name-text', 'profile-img-container', 'frost-overlay'];
        ids.forEach(id => {
            if (!document.getElementById(id)) {
                console.warn(`⚠️ Element #${id} not found`);
            }
        });
        classes.forEach(cls => {
            if (!document.querySelector(`.${cls}`)) {
                console.warn(`⚠️ Element .${cls} not found`);
            }
        });
    }
    checkRequiredElements();

    const cursor = document.querySelector('.cursor');
    if (cursor) {
        document.addEventListener('mousemove', (e) => {
            cursor.style.left = e.clientX + 'px';
            cursor.style.top = e.clientY + 'px';
        });

        const hoverElements = document.querySelectorAll('a, .profile-img');
        hoverElements.forEach(element => {
            element.addEventListener('mouseenter', () => {
                cursor.style.width = '16px';
                cursor.style.height = '16px';
            });

            element.addEventListener('mouseleave', () => {
                cursor.style.width = '8px';
                cursor.style.height = '8px';
            });
        });
    }

    const typingText = document.querySelector('.typing-text');
    if (typingText) {
        const text = 'Game & Website Developer 5+ Years';
        let index = 0;

        function typeWriter() {
            if (index < text.length) {
                typingText.textContent = text.slice(0, index + 1);
                index++;
                setTimeout(typeWriter, 100);
            } else {
                setTimeout(() => {
                    index = 0;
                    typingText.textContent = '';
                    setTimeout(typeWriter, 2000);
                }, 4000);
            }
        }

        setTimeout(typeWriter, 1000);
    }

    async function updateDiscordStatus() {
        console.log(`🔄 Updating Discord status for ID: ${CONFIG.DISCORD_USER_ID}`);
        try {
            const lanyardResponse = await fetch(`https://api.lanyard.rest/v1/users/${CONFIG.DISCORD_USER_ID}`);
            console.log('Lanyard Status:', lanyardResponse.status);
            if (lanyardResponse.ok) {
                const lanyardData = await lanyardResponse.json();
                if (lanyardData.success && lanyardData.data) {
                    console.log('✅ Lanyard Data:', lanyardData.data);
                    updateDiscordUI(lanyardData.data);
                    return;
                }
            } else {
                console.log('❌ Lanyard failed with status:', lanyardResponse.status);
            }

            if (CONFIG.DISCORD_BOT_TOKEN) {
                const discordResponse = await fetch(`https://discord.com/api/v10/users/${CONFIG.DISCORD_USER_ID}`, {
                    headers: { 'Authorization': `Bot ${CONFIG.DISCORD_BOT_TOKEN}` }
                });
                console.log('Discord API Status:', discordResponse.status);
                if (discordResponse.ok) {
                    const discordData = await discordResponse.json();
                    console.log('✅ Discord API Data:', discordData);
                    updateDiscordUIFromAPI(discordData);
                    return;
                } else {
                    console.log('❌ Discord API failed with status:', discordResponse.status);
                }
            } else {
                console.log('⚠️ No Discord bot token provided');
            }

            const lookupResponse = await fetch(`https://discordlookup.mesalytic.moe/v1/user/${CONFIG.DISCORD_USER_ID}`);
            console.log('Discord Lookup Status:', lookupResponse.status);
            if (lookupResponse.ok) {
                const lookupData = await lookupResponse.json();
                console.log('✅ Discord Lookup Data:', lookupData);
                updateDiscordUIFromLookup(lookupData);
                return;
            }

            console.log('😴 Falling back to offline');
            updateDiscordOffline();
        } catch (error) {
            console.error('❌ Error fetching Discord data:', error);
            showNotification('Failed to load Discord profile');
            updateDiscordOffline();
        }
    }

    function updateDiscordUI(userData) {
        if (window.lastDiscordUpdate && Date.now() - window.lastDiscordUpdate < 5000) {
            return;
        }
        window.lastDiscordUpdate = Date.now();

        console.log('🎨 Updating Discord UI with Lanyard:', userData);

        const avatar = document.getElementById('discord-avatar');
        const mainAvatar = document.getElementById('main-avatar');
        const username = document.getElementById('discord-username');
        const status = document.getElementById('discord-status');
        const activity = document.getElementById('discord-activity');
        const activityImage = document.getElementById('activity-image');
        const nameText = document.querySelector('.name-text'); 

        if (userData.discord_user) {
            const avatarUrl = userData.discord_user.avatar 
                ? `https://cdn.discordapp.com/avatars/${userData.discord_user.id}/${userData.discord_user.avatar}.png?size=128`
                : `https://cdn.discordapp.com/embed/avatars/${(parseInt(userData.discord_user.discriminator) || 0) % 5}.png`;

            if (avatar) avatar.src = avatarUrl;
            if (mainAvatar) mainAvatar.src = avatarUrl;

            const discordUsername = userData.discord_user.username || 'cenfoire';
            if (username) username.textContent = '@' + discordUsername;

            currentDiscordHandle = '@' + discordUsername;

            if (status) {
                const statusClass = userData.discord_status || 'offline';
                status.className = `status-indicator ${statusClass}`;
            }

            
            if (nameText) {
                if (userData.discord_status === 'online') {
                    nameText.style.background = 'var(--gradient-ice)';
                } else if (userData.discord_status === 'offline') {
                    nameText.style.background = 'linear-gradient(135deg, #4b5e8c, #6b7280, #4b5e8c)';
                } else if (userData.discord_status === 'idle') {
                    nameText.style.background = 'var(--gradient-frost)';
                } else if (userData.discord_status === 'dnd') {
                    nameText.style.background = 'linear-gradient(135deg, #ed4245, #f472b6, #ed4245)';
                } else {
                    nameText.style.background = 'var(--gradient-ice)';
                }
                nameText.style.backgroundSize = '200% 100%';
                nameText.style.webkitBackgroundClip = 'text';
                nameText.style.backgroundClip = 'text';
                nameText.style.color = 'transparent';
                nameText.style.animation = 'gradientSlide 4s linear infinite';
            }

            if (activity) {
                if (userData.activities && userData.activities.length > 0) {
                    const filteredActivities = userData.activities.filter(a => 
                        a.type !== 4 &&
                        a.name !== 'Spotify' &&
                        !a.name.toLowerCase().includes('spotify')
                    );

                    if (filteredActivities.length > 0) {
                        const currentActivity = filteredActivities[0];
                        let activityHTML = '';

                        switch (currentActivity.type) {
                            case 0:
                                activityHTML = `
                                    <span class="activity-text">
                                        🎮 Playing ${currentActivity.name}
                                        ${currentActivity.details ? `<br><small>${currentActivity.details}</small>` : ''}
                                        ${currentActivity.state ? `<br><small>${currentActivity.state}</small>` : ''}
                                    </span>
                                `;
                                if (activityImage && currentActivity.assets) {
                                    if (currentActivity.assets.large_image) {
                                        const imageUrl = currentActivity.assets.large_image.startsWith('mp:')
                                            ? `https://media.discordapp.net/${currentActivity.assets.large_image.slice(3)}`
                                            : `https://cdn.discordapp.com/app-assets/${currentActivity.application_id}/${currentActivity.assets.large_image}.png`;
                                        activityImage.src = imageUrl;
                                        activityImage.style.display = 'block';
                                    } else {
                                        activityImage.style.display = 'none';
                                    }
                                }
                                break;
                            case 1:
                                activityHTML = `
                                    <span class="activity-text">
                                        🔴 Streaming ${currentActivity.name}
                                        ${currentActivity.details ? `<br><small>${currentActivity.details}</small>` : ''}
                                    </span>
                                `;
                                break;
                            case 2:
                                activityHTML = `
                                    <span class="activity-text">
                                        🎵 Listening to ${currentActivity.name}
                                        ${currentActivity.details ? `<br><small>${currentActivity.details}</small>` : ''}
                                        ${currentActivity.state ? `<br><small>by ${currentActivity.state}</small>` : ''}
                                    </span>
                                `;
                                break;
                            case 3:
                                activityHTML = `
                                    <span class="activity-text">
                                        📺 Watching ${currentActivity.name}
                                        ${currentActivity.details ? `<br><small>${currentActivity.details}</small>` : ''}
                                    </span>
                                `;
                                break;
                            default:
                                activityHTML = `
                                    <span class="activity-text">
                                        ${currentActivity.name}
                                        ${currentActivity.details ? `<br><small>${currentActivity.details}</small>` : ''}
                                    </span>
                                `;
                        }

                        activity.innerHTML = activityHTML;
                    } else {
                        activity.innerHTML = '<span class="activity-text">No activity</span>';
                        if (activityImage) activityImage.style.display = 'none';
                    }
                } else {
                    activity.innerHTML = '<span class="activity-text">No activity</span>';
                    if (activityImage) activityImage.style.display = 'none';
                }
            }

            if (userData.spotify) {
                updateSpotifyFromDiscord(userData.spotify);
            }
        }
    }

    function updateDiscordUIFromLookup(userData) {
        console.log('🎨 Updating Discord UI with Lookup:', userData);

        const avatar = document.getElementById('discord-avatar');
        const mainAvatar = document.getElementById('main-avatar');
        const username = document.getElementById('discord-username');
        const discriminator = document.getElementById('discord-discriminator');
        const status = document.getElementById('discord-status');
        const activity = document.getElementById('discord-activity');
        const nameText = document.querySelector('.name-text');

        const avatarUrl = userData.avatar && userData.avatar.link 
            ? userData.avatar.link
            : `https://cdn.discordapp.com/embed/avatars/0.png`;

        if (avatar) avatar.src = avatarUrl;
        if (mainAvatar) mainAvatar.src = avatarUrl;

        if (username) username.textContent = userData.username || 'c';
        if (discriminator) {
            discriminator.textContent = userData.discriminator 
                ? `#${userData.discriminator}` 
                : '';
        }

        if (status) status.className = 'status-indicator online';
        if (activity) activity.innerHTML = '<span class="activity-text">Online</span>';

        if (nameText) {
            nameText.style.background = 'var(--gradient-ice)';
            nameText.style.backgroundSize = '200% 100%';
            nameText.style.webkitBackgroundClip = 'text';
            nameText.style.backgroundClip = 'text';
            nameText.style.color = 'transparent';
            nameText.style.animation = 'gradientSlide 4s linear infinite';
        }
    }

    function updateDiscordUIFromAPI(userData) {
        console.log('🎨 Updating Discord UI with API:', userData);

        const avatar = document.getElementById('discord-avatar');
        const mainAvatar = document.getElementById('main-avatar');
        const username = document.getElementById('discord-username');
        const discriminator = document.getElementById('discord-discriminator');
        const nameText = document.querySelector('.name-text');

        const avatarUrl = userData.avatar 
            ? `https://cdn.discordapp.com/avatars/${userData.id}/${userData.avatar}.png?size=128`
            : `https://cdn.discordapp.com/embed/avatars/${(parseInt(userData.discriminator) || 0) % 5}.png`;

        if (avatar) avatar.src = avatarUrl;
        if (mainAvatar) mainAvatar.src = avatarUrl;

        if (username) username.textContent = userData.username || 'c';
        if (discriminator) {
            discriminator.textContent = userData.discriminator 
                ? `#${userData.discriminator}` 
                : '';
        }

        if (nameText) {
            nameText.style.background = 'var(--gradient-ice)';
            nameText.style.backgroundSize = '200% 100%';
            nameText.style.webkitBackgroundClip = 'text';
            nameText.style.backgroundClip = 'text';
            nameText.style.color = 'transparent';
            nameText.style.animation = 'gradientSlide 4s linear infinite';
        }
    }

    function updateDiscordOffline() {
        console.log('😴 Offline');

        const avatar = document.getElementById('discord-avatar');
        const mainAvatar = document.getElementById('main-avatar');
        const username = document.getElementById('discord-username');
        const discriminator = document.getElementById('discord-discriminator');
        const status = document.getElementById('discord-status');
        const activity = document.getElementById('discord-activity');
        const nameText = document.querySelector('.name-text');

        const defaultAvatar = 'https://cdn.discordapp.com/embed/avatars/0.png';
        if (avatar) avatar.src = defaultAvatar;
        if (mainAvatar) mainAvatar.src = defaultAvatar;

        if (username) username.textContent = 'c';
        if (discriminator) discriminator.textContent = '';
        if (status) status.className = 'status-indicator offline';
        if (activity) activity.innerHTML = '<span class="activity-text">Offline</span>';

        if (nameText) {
            nameText.style.background = 'linear-gradient(135deg, #4b5e8c, #6b7280, #4b5e8c)';
            nameText.style.backgroundSize = '200% 100%';
            nameText.style.webkitBackgroundClip = 'text';
            nameText.style.backgroundClip = 'text';
            nameText.style.color = 'transparent';
            nameText.style.animation = 'gradientSlide 4s linear infinite';
        }
    }

    function updateSpotifyFromDiscord(spotifyData) {
        const trackName = document.getElementById('spotify-track');
        const artistName = document.getElementById('spotify-artist');
        const albumArt = document.getElementById('spotify-album');

        if (spotifyData && spotifyData.song) {
            if (trackName) trackName.textContent = spotifyData.song;
            if (artistName) artistName.textContent = spotifyData.artist;

            if (albumArt && spotifyData.album_art_url) {
                albumArt.src = spotifyData.album_art_url;
                albumArt.style.display = 'block';
            }
        } else {
            if (trackName) trackName.textContent = 'Not playing';
            if (artistName) artistName.textContent = '-';
            if (albumArt) albumArt.style.display = 'none';
        }
    }

    async function updateSpotifyStatus() {
        try {
            const token = localStorage.getItem('spotify_access_token');
            if (!token) {
                console.log('⚠️ No Spotify access token found');
                return;
            }

            const response = await fetch('https://api.spotify.com/v1/me/player/currently-playing', {
                headers: { 'Authorization': `Bearer ${token}` }
            });

            console.log('Spotify API Status:', response.status);
            if (response.ok && response.status !== 204) {
                const data = await response.json();
                console.log('✅ Spotify Data:', data);
                updateSpotifyUI(data);
            } else if (response.status === 401) {
                console.log('❌ Spotify token expired');
                localStorage.removeItem('spotify_access_token');
                authenticateSpotify();
            } else {
                console.log('⚠️ No music currently playing');
                updateSpotifyUI(null);
            }
        } catch (error) {
            console.error('❌ Spotify API Error:', error);
            updateSpotifyUI(null);
        }
    }

    function updateSpotifyUI(data) {
        const trackName = document.getElementById('spotify-track');
        const artistName = document.getElementById('spotify-artist');
        const albumArt = document.getElementById('spotify-album');
        const albumArtContainer = document.querySelector('.album-art');
        const spotifyWidget = document.querySelector('.spotify-widget');

        if (data && data.is_playing && data.item) {
            if (trackName) trackName.textContent = data.item.name;
            if (artistName) artistName.textContent = data.item.artists.map(artist => artist.name).join(', ');

            if (albumArt && data.item.album && data.item.album.images && data.item.album.images.length > 0) {
                albumArt.src = data.item.album.images[0].url;
                if (albumArtContainer) albumArtContainer.style.display = 'block';
            }

            if (spotifyWidget) spotifyWidget.classList.remove('no-music');
        } else {
            if (trackName) trackName.textContent = 'Not playing';
            if (artistName) artistName.textContent = '';
            if (albumArtContainer) albumArtContainer.style.display = 'none';

            if (spotifyWidget) spotifyWidget.classList.add('no-music');
        }
    }

    function initSpotifyAuth() {
        const params = new URLSearchParams(window.location.hash.substring(1));
        const accessToken = params.get('access_token');

        if (accessToken) {
            localStorage.setItem('spotify_access_token', accessToken);
            window.location.hash = '';
        }
    }

    function authenticateSpotify() {
        const scopes = 'user-read-currently-playing user-read-playback-state';
        const redirectUri = window.location.origin + window.location.pathname;

        const authUrl = `https://accounts.spotify.com/authorize?` +
            `client_id=${CONFIG.SPOTIFY_CLIENT_ID}&` +
            `response_type=token&` +
            `redirect_uri=${encodeURIComponent(redirectUri)}&` +
            `scope=${encodeURIComponent(scopes)}`;

        window.location.href = authUrl;
    }

    const discordLink = document.querySelector('.discord-link');
    if (discordLink) {
        discordLink.addEventListener('click', (e) => {
            e.preventDefault();
            const usernameElement = document.getElementById('discord-username');
            const currentUsername = usernameElement ? usernameElement.textContent : '@don';

            navigator.clipboard.writeText(currentUsername).then(() => {
                showNotification(`Discord username copied: ${currentUsername}`);
            }).catch(() => {
                showNotification('Error copying username');
            });
        });
    }

    const spotifyLink = document.querySelector('.spotify-link');
    if (spotifyLink) {
        spotifyLink.addEventListener('click', (e) => {
            e.preventDefault();
            if (!localStorage.getItem('spotify_access_token')) {
                authenticateSpotify();
            } else {
                window.open('https://open.spotify.com/', '_blank');
            }
        });
    }

    function showNotification(message) {
        const notification = document.createElement('div');
        notification.className = 'notification';
        notification.style.cssText = `
            position: fixed;
            bottom: 20px;
            right: 20px;
            background: rgba(0, 0, 0, 0.9);
            color: var(--text-primary);
            padding: 12px 20px;
            border-radius: 8px;
            border: 1px solid var(--border-color);
            backdrop-filter: blur(20px);
            z-index: 10000;
            font-size: 14px;
            animation: slideInRight 0.3s ease;
        `;
        notification.textContent = message;
        document.body.appendChild(notification);

        setTimeout(() => {
            notification.style.animation = 'slideOutRight 0.3s ease';
            setTimeout(() => notification.remove(), 300);
        }, 3000);
    }

    function updateLastSeen() {
        const lastSeenElement = document.getElementById('last-seen');
        if (lastSeenElement) {
            const now = new Date();
            const timeString = now.toLocaleTimeString('en-US', {
                hour: '2-digit',
                minute: '2-digit'
            });
            lastSeenElement.textContent = `My time is: ${timeString}`;
        }
    }

    function createExtraSnow() {
        const snowContainer = document.querySelector('.snow-container');
        if (snowContainer) {
            for (let i = 0; i < 20; i++) {
                const snowflake = document.createElement('div');
                snowflake.className = 'snow';
                snowflake.style.left = Math.random() * 100 + '%';
                snowflake.style.animationDuration = (Math.random() * 10 + 5) + 's';
                snowflake.style.animationDelay = Math.random() * 5 + 's';
                snowflake.style.width = snowflake.style.height = (Math.random() * 3 + 1) + 'px';
                snowContainer.appendChild(snowflake);
            }
        }
    }

    console.log('❄️ Initializing winter theme...'); 

    initSpotifyAuth();
    updateDiscordStatus();
    updateSpotifyStatus();
    updateLastSeen();
    createExtraSnow();

    setInterval(updateDiscordStatus, CONFIG.UPDATE_INTERVAL);
    setInterval(updateSpotifyStatus, CONFIG.SPOTIFY_UPDATE_INTERVAL);
    setInterval(updateLastSeen, 60000);

    console.log('✅ Winter theme initialized');
});