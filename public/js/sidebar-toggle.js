// Sidebar Toggle Functionality
document.addEventListener('DOMContentLoaded', function() {
    const toggleButton = document.getElementById('toggleSidebar');
    const sidebar = document.getElementById('sidebar');
    const main = document.querySelector('.main');
    
    // Function to forcefully apply correct layout
    function fixLayout() {
        if (sidebar.classList.contains('collapsed')) {
            console.log("Sidebar is collapsed, adjusting main content");
            main.style.width = 'calc(100% - 80px)';
            main.style.marginLeft = '80px';
        } else {
            console.log("Sidebar is expanded, adjusting main content");
            main.style.width = 'calc(100% - 280px)';
            main.style.marginLeft = '280px';
        }
    }
    
    // Apply initial fix
    setTimeout(fixLayout, 100);
    
    if (toggleButton && sidebar && main) {
        // Initial layout adjustment
        adjustLayout();
        
        toggleButton.addEventListener('click', function() {
            sidebar.classList.toggle('collapsed');
            
            // Immediate fix for main content
            fixLayout();
            
            // Force a reflow to ensure smooth transitions
            window.requestAnimationFrame(() => {
                // Adjust layout after sidebar state change
                adjustLayout();
            });
        });
    }
    
    // Function to adjust layout based on sidebar state
    function adjustLayout() {
        const windowWidth = window.innerWidth;
        const isCollapsed = sidebar.classList.contains('collapsed');
        
        if (windowWidth <= 991) {
            // Mobile/tablet layout
            if (!isCollapsed) {
                main.style.width = 'calc(100% - 80px)';
                main.style.marginLeft = '80px';
            } else {
                main.style.width = '100%';
                main.style.marginLeft = '0';
            }
        } else {
            // Desktop layout
            if (isCollapsed) {
                main.style.width = 'calc(100% - 80px)';
                main.style.marginLeft = '80px';
            } else {
                main.style.width = 'calc(100% - 280px)';
                main.style.marginLeft = '280px';
            }
        }
    }
    
    // Run adjustment on window resize
    window.addEventListener('resize', adjustLayout);
}); 