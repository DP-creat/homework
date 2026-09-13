

function renderHeaderIcon(name) {
    const headerDock = document.querySelector('.status-dock');
    if (!headerDock || document.querySelector(`.header-icon-${name}`)) return;

    const iconAnchor = document.createElement('div');
    iconAnchor.className = `header-anchor header-icon-${name}`;
    
    iconAnchor.onclick = () => window.focusOnHardware(name);

    iconAnchor.innerHTML = `
        <div class="btn-tool-mini">
            <span>${name.substring(0, 2).toUpperCase()}</span>
        </div>
    `;
    
    headerDock.appendChild(iconAnchor);
}
