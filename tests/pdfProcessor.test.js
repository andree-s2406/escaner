const fs = require('fs');
const vm = require('vm');
const assert = require('assert');

const source = fs.readFileSync('js/pdfProcessor.js', 'utf8');

const context = {
    console: {
        log() {},
        warn() {},
        error() {}
    },
    window: {}
};

vm.createContext(context);
vm.runInContext(source, context);

const {
    detectarTipoPDF,
    extraerDestinatario,
    extraerDeTiendaNube
} = context.window;

function test(nombre, fn) {
    try {
        fn();
        console.log(`✅ ${nombre}`);
    } catch (error) {
        console.error(`❌ ${nombre}: ${error.message}`);
        process.exitCode = 1;
    }
}

test('extrae destinatario correctamente', () => {
    assert.strictEqual(
        extraerDestinatario(
            'Orden #1234\nEntregar a: Juan Pérez\nTeléfono: 1122334455'
        ),
        'Juan Pérez'
    );
});

test('maneja texto inválido', () => {
    assert.strictEqual(
        extraerDestinatario(''),
        'Desconocido'
    );
});

test('limpia números al final del destinatario', () => {
    assert.strictEqual(
        extraerDestinatario(
            'Enviar a: María López 123456789'
        ),
        'María López'
    );
});

test('extrae una orden de Tienda Nube', () => {
    const resultado = extraerDeTiendaNube(
        'Orden #1234\nEntregar a: Juan Pérez\n'
    );

    assert.strictEqual(resultado.length, 1);
    assert.strictEqual(resultado[0].numero_orden, '#1234');
    assert.strictEqual(resultado[0].destinatario, 'Juan Pérez');
    assert.strictEqual(resultado[0].esShowroom, false);
});

test('detecta Tienda Nube', () => {
    assert.strictEqual(
        detectarTipoPDF('Orden #1234'),
        'tienda_nube'
    );
});

console.log('\nTodos los tests finalizaron correctamente.');
