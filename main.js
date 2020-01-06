const gridDefaultOptions = {
    grid: 'grid',
    colors: ['#1D1E22', '#FFFFFF'],
    binary: ['0', '1'],
    gridWidth: 16,
    gridHeight: 16,
    gridModule: 8,
    currentHexCode: '',
    currentBinaryCode: []
};

class PixelArtBit {
    constructor(options = []) {
        const gridOptions = {...gridDefaultOptions, ...options};

        this.grid = document.getElementById(gridOptions.grid);
        this.colors = gridOptions.colors;
        this.binary = gridOptions.binary;
        this.gridWidth = gridOptions.gridWidth;
        this.gridHeight = gridOptions.gridHeight;
        this.gridModule = gridOptions.gridModule;
        this.currentZoom = 1;
        this.zoomFactor = 0.1;

        this.initEvents();
    }

    initEvents() {
        document.getElementById("inputDataAreaSubmit").addEventListener('click',
            () => this.loadDataIntoGrid()
        );

        document.getElementById("zoomIn").addEventListener('click',
            () => this.zoom('in')
        );

        document.getElementById("zoomOut").addEventListener('click',
            () => this.zoom('out')
        );
    }

    zoom(type) {
        this.currentZoom = (type === 'in') ?
            Math.min(1, this.currentZoom + this.zoomFactor) :
            Math.max(0.1, this.currentZoom - this.zoomFactor);

        this.grid.style.transform = `scale(${this.currentZoom})`;
    }

    checkHex(n) {
        return /^[0-9A-Fa-f]{1,64}$/.test(n);
    }

    Hex2Bin(n) {
        return !this.checkHex(n) ? 0 : parseInt(n, 16).toString(2);
    }

    padToEight(number) {
        return number <= 9999999 ? `0000000${number}`.slice(-8) : number;
    }

    generateGrid() {
        let row,
            cell;

        this.grid.innerHTML = '';

        for (let i = 0; i < this.gridWidth; i++) {
            row = this.grid.insertRow(i);
            for (let j = 0; j < this.gridHeight; j++) {
                cell = row.insertCell(j);
                cell.onclick = (e) => this.clickCell(e.currentTarget);
                cell.innerText = '0';
            }
        }

        this.generateBinaryCode();

        return this;
    }

    generateBinaryCode3() {
        let loops = this.gridWidth / this.gridModule,
            currentLoop = 1;

        this.binaryCode = [];

        do {
            for (let i = 0; i < this.gridWidth; i++) {
                let yPos = (this.gridModule * currentLoop) - 1,
                    byte = '';

                for (let j = yPos; j > yPos - (this.gridModule); j--) {
                    byte += this.grid.rows[j].cells[i].innerText;
                }

                this.binaryCode.push(byte);
            }
            currentLoop++;
        } while (currentLoop <= loops);

        this.printCode(this.binaryCode);
    }

    generateBinaryCode() {
        const fullModule = this.gridModule * 2,
            totalLoops = this.gridWidth / this.gridModule,
            totalSubmodules = 2,
            totalSubmoduleLoops = totalLoops / totalSubmodules;

        let currentSubmodule = 0;

        this.binaryCode = [];

        do {
            for (let currentLoop = 0; currentLoop < totalLoops; currentLoop++) {
                let submodulePos = currentSubmodule * fullModule;
                for (let currentCol = submodulePos; currentCol < submodulePos + fullModule; currentCol++) {
                    let currentCelPos = ((currentLoop + 1) * this.gridModule) - 1,
                        byte = '';

                    for (let currentCell = currentCelPos; currentCell > currentCelPos - this.gridModule; currentCell--) {
                        byte += this.grid.rows[currentCell].cells[currentCol].innerText;
                    }

                    this.binaryCode.push(byte);
                }
            }

            currentSubmodule++;
        } while (currentSubmodule < totalSubmoduleLoops);

        this.printCode(this.binaryCode);
    }

    printCode(binaryCode) {
        this.currentHexCode = binaryCode.map(
            byte => '0x' + ('00' + parseInt(byte, 2).toString(16)).substr(-2)
        ).join(', ');

        binaryCode = binaryCode.join(', ');

        document.getElementById('binaryCode').innerHTML = binaryCode;
        document.getElementById('hexCode').innerHTML = this.currentHexCode;
        document.getElementById('fileSize').innerHTML = this.getTotalBytes();
    }

    getTotalBytes() {
        return (this.gridWidth * this.gridHeight) / this.gridModule;
    }

    clearGrid() {
        let color = this.colors[0],
            binaryValue = this.binary[0];

        for (let i = 0; i < this.gridWidth; i++) {
            for (let j = 0; j < this.gridHeight; j++) {
                let cell = this.grid.rows[i].cells[j];
                cell.style.backgroundColor = color;
                cell.innerText = binaryValue;
            }
        }

        this.generateBinaryCode();
    }

    /*fillGridWithDataOld(data) {
        const byte = data.join('').split(''),
            loops = this.gridWidth / this.gridModule;

        let bit = 0,
            currentLoop = 1;

        do {
            for (let i = 0; i < this.gridWidth; i++) {
                let yPos = (this.gridModule * currentLoop) - 1;

                for (let j = yPos; j > yPos - (this.gridModule); j--) {

                    let cell = this.grid.rows[j].cells[i],
                        currentBit = byte[bit++];

                    cell.style.backgroundColor = this.colors[currentBit];
                    cell.innerText = currentBit;
                }
            }
            currentLoop++;
        } while (currentLoop <= loops);

        this.generateBinaryCode();
    }*/

    fillGridWithData(data) {
        const byte = data.join('').split(''),
            fullModule = this.gridModule * 2,
            totalLoops = this.gridWidth / this.gridModule,
            totalSubmodules = 2,
            totalSubmoduleLoops = totalLoops / totalSubmodules;

        let bytes = 0, bit = 0;
        let currentSubmodule = 0;

        do {
            for (let currentLoop = 0; currentLoop < totalLoops; currentLoop++) {
                let submodulePos = currentSubmodule * fullModule;
                for (let currentCol = submodulePos; currentCol < submodulePos + fullModule; currentCol++) {
                    let currentCelPos = ((currentLoop + 1) * this.gridModule) - 1;
                    for (let currentCell = currentCelPos; currentCell > currentCelPos - this.gridModule; currentCell--) {
                        let cell = this.grid.rows[currentCell].cells[currentCol],
                            currentBit = byte[bit++];

                        cell.style.backgroundColor = this.colors[currentBit];
                        cell.innerText = currentBit;
                    }

                    bytes++;
                }
            }

            currentSubmodule++;
        } while (currentSubmodule < totalSubmoduleLoops);

        this.generateBinaryCode();
    }

    invertGrid() {
        for (let i = 0; i < this.gridWidth; i++) {
            for (let j = 0; j < this.gridHeight; j++) {
                let cell = this.grid.rows[i].cells[j];
                let inverseCellValue = this.getInverseCellValue(cell);
                cell.style.backgroundColor = this.colors[inverseCellValue];
                cell.innerText = this.binary[inverseCellValue];
            }
        }

        this.generateBinaryCode();
    }

    getInverseCellValue(cell) {
        return cell.innerText === '0' ? 1 : 0;
    }

    flipGrid() {
        let data = this.reverse(this.binaryCode, this.gridWidth);
        this.fillGridWithData(data);
    }

    showBinary() {
        document.getElementById('grid').className =
            (document.getElementById('grid').className === 'hideBinary') ? '' : 'hideBinary';
    }

    clickCell(cell) {
        let inverseCellValue = this.getInverseCellValue(cell);
        cell.style.backgroundColor = this.colors[inverseCellValue];
        cell.innerText = this.binary[inverseCellValue];

        this.generateBinaryCode();
    }

    loadDataIntoGrid() {
        let data = (document.getElementById('inputDataArea').value).replace(/\s+/g, '');
        data = data.split(',').filter(Boolean);

        data = data.map(value => value.replace(/0x/g, ''));
        data = data.map(value => this.padToEight(this.Hex2Bin(value)));

        this.setDataGridSize(data)
            .generateGrid()
            .fillGridWithData(data);
    }

    setDataGridSize(data) {
        let gridSize = Math.sqrt(data.length * 8);

        this.gridWidth = gridSize;
        this.gridHeight = gridSize;

        return this;
    }

    reverse(arr, k) {
        const n = arr.length;

        for (let i = 0; i < n; i += k) {
            let left = i,
                right = Math.min(i + k - 1, n - 1),
                temp;

            // reverse the sub-array [left, right]
            while (left < right) {
                temp = arr[left];
                arr[left] = arr[right];
                arr[right] = temp;
                left++;
                right--;
            }
        }

        return arr;
    }
}

let pixelArtBit = new PixelArtBit();
pixelArtBit.generateGrid();
