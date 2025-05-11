const fs = require('fs');
const pdf = require('pdf-parse');

const pdfPath = 'pdf/Constitucion.pdf';
const outputPath = 'articulos.json';

async function extraerArticulos() {
    try {
        const dataBuffer = fs.readFileSync(pdfPath);
        
        const options = {
            pagerender: function(pageData) {
                return pageData.getTextContent().then(function(textContent) {
                    let text = '';
                    for (let item of textContent.items) {
                        text += item.str + ' ';
                    }
                    return text;
                });
            }
        };
        
        const data = await pdf(dataBuffer, options);
        

        let textoCompleto = data.text;
        

        textoCompleto = textoCompleto.replace(/\r\n/g, '\n').replace(/\s+/g, ' ');
        
        textoCompleto = textoCompleto.replace(/A\s*r\s*t\s*[ií]\s*c\s*u\s*l\s*o/gi, function(match) {
            return '\nArtículo';
        });
        
        
        fs.writeFileSync('texto_extraido.txt', textoCompleto, 'utf8');
        
        
        const regex = /\nArtículo\s+(\d+)\s*\.\s+([^]*?)(?=\nArtículo\s+\d+|$)/gi;
        
        let match;
        const articulos = [];
        
        
        const numerosEncontrados = new Set();
        
        while ((match = regex.exec(textoCompleto)) !== null) {
            const numeroArticulo = parseInt(match[1], 10);
            let textoArticulo = match[2].trim();
            
            textoArticulo = textoArticulo.replace(/\s+/g, ' ');
            
            if (numeroArticulo && textoArticulo) {
                articulos.push({
                    number: numeroArticulo,
                    text: textoArticulo
                });
                numerosEncontrados.add(numeroArticulo);
            }
        }
        
        console.log(`Found ${articulos.length} articles.`);
        console.log(`Article numbers found: ${[...numerosEncontrados].sort((a, b) => a - b).join(', ')}`);
        
        const totalEsperado = Math.max(...numerosEncontrados);
        const faltantes = [];
        for (let i = 1; i <= totalEsperado; i++) {
            if (!numerosEncontrados.has(i)) {
                faltantes.push(i);
            }
        }
        
        if (faltantes.length > 0) {
            console.log(`Warning: These articles were not found: ${faltantes.join(', ')}`);
        }
        
        if (articulos.length === 0) {
            console.log("No articles found with the current pattern. Check the PDF text and regular expression.");
            console.log("Extracted text (first 1000 characters):\n", textoCompleto.substring(0, 1000));
            return;
        }

        articulos.sort((a, b) => a.number - b.number);

        const jsonOutput = {
            articles: articulos
        };

        fs.writeFileSync(outputPath, JSON.stringify(jsonOutput, null, 2), 'utf8');
        console.log(`Articles have been extracted and saved to ${outputPath}`);

    } catch (error) {
        console.error('Error processing the PDF:', error);
        if (error.message.includes('No such file or directory') && error.path === pdfPath) {
            console.error(`Make sure the file "${pdfPath}" exists in the same directory as the script.`);
        }
    }
}

module.exports = extraerArticulos;
