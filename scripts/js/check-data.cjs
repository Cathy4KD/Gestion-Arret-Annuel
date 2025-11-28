const fs = require('fs');
const data = JSON.parse(fs.readFileSync('server/data/application-data.json', 'utf8'));

console.log('=== MODULES DISPONIBLES ===');
const modules = Object.keys(data).filter(k => !k.startsWith('_'));
modules.forEach(m => console.log('- ' + m));

console.log('\n=== TAILLES DES DONNÉES ===');
modules.forEach(k => {
    const size = JSON.stringify(data[k]).length;
    if (size > 100) {
        console.log(k + ':', Math.round(size/1024) + ' KB');
    }
});

console.log('\n=== VÉRIFICATION SPÉCIFIQUE ===');
console.log('tpaaPwCachedData existe?', !!data.tpaaPwCachedData);
if (data.tpaaPwCachedData) {
    console.log('  - tpaaData:', data.tpaaPwCachedData.tpaaData ? data.tpaaPwCachedData.tpaaData.length + ' entrées' : 'VIDE');
    console.log('  - pwData:', data.tpaaPwCachedData.pwData ? data.tpaaPwCachedData.pwData.length + ' entrées' : 'VIDE');
}

console.log('scopeFilters existe?', !!data.scopeFilters);
if (data.scopeFilters) {
    console.log('  Nombre de pages avec filtres:', Object.keys(data.scopeFilters).length);
    Object.keys(data.scopeFilters).forEach(page => {
        console.log('  - ' + page + ':', data.scopeFilters[page].length + ' postes sélectionnés');
    });
}

console.log('posteAllocations existe?', !!data.posteAllocations);
if (data.posteAllocations) {
    console.log('  Nombre de postes alloués:', Object.keys(data.posteAllocations).length);
}
