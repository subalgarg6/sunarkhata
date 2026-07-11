const fs = require('fs');

const metalOldRegex = /<div class="grid grid-cols-2 gap-2 mb-3">[\s\S]*?<div class="grid \$\{showBookRate \? 'grid-cols-2' : 'grid-cols-1'\} gap-2">[\s\S]*?<\/div>/;

const metalNewHTML = `<div class="grid grid-cols-2 gap-2 mb-3">
                            <button class="act-btn bg-black text-white font-label-bold py-3 px-1 rounded flex items-center justify-center text-center leading-tight transition-opacity hover:opacity-90 text-[11px] lg:text-[12px] uppercase tracking-tight border border-black h-[52px]" data-type="\${metalActions.action1Op}">
                                <span class="material-symbols-outlined text-[16px] mr-1">add</span> 
                                <span class="flex-1">\${metalActions.action1Label}</span>
                            </button>
                            <button class="act-btn bg-white text-black font-label-bold py-3 px-1 rounded flex items-center justify-center text-center leading-tight transition-all hover:bg-surface-container-low border border-surface-variant text-[11px] lg:text-[12px] uppercase tracking-tight h-[52px]" data-type="\${metalActions.action2Op}">
                                <span class="material-symbols-outlined text-[16px] mr-1">remove</span> 
                                <span class="flex-1">\${metalActions.action2Label}</span>
                            </button>
                            <button class="act-btn \${showBookRate ? '' : 'col-span-2 '}bg-white text-black font-label-bold py-3 px-1 rounded flex items-center justify-center text-center leading-tight transition-all hover:bg-surface-container-low border border-surface-variant text-[11px] lg:text-[12px] uppercase tracking-tight h-[52px]" data-type="convert_metal_to_rupee">
                                Metal to Rupee
                            </button>
                            \${showBookRate ? \`
                            <button class="act-btn bg-white text-black font-label-bold py-3 px-1 rounded flex items-center justify-center text-center leading-tight transition-all hover:bg-gold-metallic/5 border border-gold-metallic text-[11px] lg:text-[12px] uppercase tracking-tight h-[52px]" data-type="rate_booking">
                                Book Rate
                            </button>
                            \` : ''}
                        </div>`;

const rupeeOldRegex = /<div class="grid grid-cols-2 gap-2 mb-3">[\s\S]*?<button class="act-btn w-full bg-surface-container-high text-on-surface font-label-bold py-2 rounded-sm hover:bg-surface-dim transition-colors text-\[10px\] lg:text-\[11px\] uppercase tracking-wider" data-type="convert_rupee_to_metal">[\s\S]*?Rupee to Metal[\s\S]*?<\/button>/;

const rupeeNewHTML = `<div class="grid grid-cols-2 gap-2 mb-3">
                            <button class="act-btn bg-black text-white font-label-bold py-3 px-1 rounded flex items-center justify-center text-center leading-tight transition-opacity hover:opacity-90 text-[11px] lg:text-[12px] uppercase tracking-tight border border-black h-[52px]" data-type="\${rupeeActions.action1Op}">
                                <span class="material-symbols-outlined text-[16px] mr-1">add</span> 
                                <span class="flex-1">\${rupeeActions.action1Label}</span>
                            </button>
                            <button class="act-btn bg-white text-black font-label-bold py-3 px-1 rounded flex items-center justify-center text-center leading-tight transition-all hover:bg-surface-container-low border border-surface-variant text-[11px] lg:text-[12px] uppercase tracking-tight h-[52px]" data-type="\${rupeeActions.action2Op}">
                                <span class="material-symbols-outlined text-[16px] mr-1">remove</span> 
                                <span class="flex-1">\${rupeeActions.action2Label}</span>
                            </button>
                            <button class="act-btn col-span-2 bg-white text-black font-label-bold py-3 px-1 rounded flex items-center justify-center text-center leading-tight transition-all hover:bg-surface-container-low border border-surface-variant text-[11px] lg:text-[12px] uppercase tracking-tight h-[52px]" data-type="convert_rupee_to_metal">
                                Rupee to Metal
                            </button>
                        </div>`;

function patchFile(filepath) {
    let content = fs.readFileSync(filepath, 'utf8');
    
    if (metalOldRegex.test(content)) {
        content = content.replace(metalOldRegex, metalNewHTML);
        console.log('Patched Metal section in ' + filepath);
    } else {
        console.log('Could not find Metal section in ' + filepath);
    }

    if (rupeeOldRegex.test(content)) {
        content = content.replace(rupeeOldRegex, rupeeNewHTML);
        console.log('Patched Rupee section in ' + filepath);
    } else {
        console.log('Could not find Rupee section in ' + filepath);
    }
    
    fs.writeFileSync(filepath, content);
}

patchFile('src/pages/individual-account.js');
patchFile('src/pages/mutual-account.js');
