/**
 * Convertit un nombre en lettres (français)
 * Version simplifiée pour les montants en euros
 */
function convertirNombre(n: number): string {
  const unites = ['', 'un', 'deux', 'trois', 'quatre', 'cinq', 'six', 'sept', 'huit', 'neuf', 'dix',
    'onze', 'douze', 'treize', 'quatorze', 'quinze', 'seize', 'dix-sept', 'dix-huit', 'dix-neuf'];
  const dizaines = ['', '', 'vingt', 'trente', 'quarante', 'cinquante', 'soixante', 'soixante', 'quatre-vingt', 'quatre-vingt'];
  
  if (n === 0) return 'zéro';
  if (n < 20) return unites[n];
  
  const dizaine = Math.floor(n / 10);
  const unite = n % 10;
  
  if (dizaine === 7 || dizaine === 9) {
    const base = dizaine === 7 ? 60 : 80;
    const reste = n - base;
    return dizaines[Math.floor(base / 10)] + (reste > 0 ? '-' + unites[reste] : '');
  }
  
  let result = dizaines[dizaine];
  if (unite > 0) {
    result += (dizaine === 8 ? '-' : ' ') + unites[unite];
  } else if (dizaine === 8) {
    result += 's';
  }
  
  return result;
}

export function nombreEnLettres(nombre: number): string {
  const unites = ['', 'un', 'deux', 'trois', 'quatre', 'cinq', 'six', 'sept', 'huit', 'neuf', 'dix',
    'onze', 'douze', 'treize', 'quatorze', 'quinze', 'seize', 'dix-sept', 'dix-huit', 'dix-neuf'];
  const dizaines = ['', '', 'vingt', 'trente', 'quarante', 'cinquante', 'soixante', 'soixante', 'quatre-vingt', 'quatre-vingt'];
  
  const entier = Math.floor(nombre);
  const decimales = Math.round((nombre - entier) * 100);
  
  if (entier === 0 && decimales === 0) return 'zéro euro';
  
  let resultat = '';
  let reste = entier;
  
  // Gestion des millions
  if (reste >= 1000000) {
    const millions = Math.floor(reste / 1000000);
    resultat += convertirNombre(millions) + ' million' + (millions > 1 ? 's' : '') + ' ';
    reste = reste % 1000000;
  }
  
  // Gestion des milliers
  if (reste >= 1000) {
    const milliers = Math.floor(reste / 1000);
    if (milliers === 1) {
      resultat += 'mille ';
    } else {
      resultat += convertirNombre(milliers) + ' mille ';
    }
    reste = reste % 1000;
  }
  
  // Gestion des centaines
  if (reste >= 100) {
    const centaines = Math.floor(reste / 100);
    if (centaines === 1) {
      resultat += 'cent ';
    } else {
      resultat += unites[centaines] + ' cent' + (centaines > 1 && reste % 100 === 0 ? 's' : '') + ' ';
    }
    reste = reste % 100;
  }
  
  // Gestion des dizaines et unités
  if (reste >= 20) {
    const dizaine = Math.floor(reste / 10);
    const unite = reste % 10;
    
    if (dizaine === 7 || dizaine === 9) {
      // Soixante-dix, quatre-vingt-dix
      const base = dizaine === 7 ? 60 : 80;
      const resteUnite = reste - base;
      resultat += dizaines[Math.floor(base / 10)] + (resteUnite > 0 ? '-' + unites[resteUnite] : '');
    } else {
      resultat += dizaines[dizaine];
      if (unite > 0) {
        resultat += (dizaine === 8 ? '-' : ' ') + unites[unite];
      } else if (dizaine === 8) {
        resultat += 's';
      }
    }
  } else if (reste > 0) {
    resultat += unites[reste];
  }
  
  // Ajout des centimes
  if (decimales > 0) {
    resultat += ' euro' + (entier > 1 ? 's' : '') + ' et ' + convertirNombre(decimales) + ' centime' + (decimales > 1 ? 's' : '');
  } else {
    resultat += ' euro' + (entier > 1 ? 's' : '');
  }
  
  return resultat.trim();
}

