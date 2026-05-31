#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

// 使用 macOS sips 命令压缩图片
function compressImageWithSips(inputPath, outputPath, targetSizeKB) {
    // 先获取原始尺寸
    const widthOutput = execSync(`sips -g pixelWidth "${inputPath}"`, { encoding: 'utf8' });
    const heightOutput = execSync(`sips -g pixelHeight "${inputPath}"`, { encoding: 'utf8' });
    const originalWidth = parseInt(widthOutput.match(/pixelWidth: (\d+)/)[1]);
    const originalHeight = parseInt(heightOutput.match(/pixelHeight: (\d+)/)[1]);
    console.log(`📏 原始尺寸: ${originalWidth} x ${originalHeight}`);

    // 转为 JPEG 格式，初始质量 80
    try {
        execSync(`sips -s format jpeg -s formatOptions 80 "${inputPath}" --out "${outputPath}"`, { stdio: 'ignore' });
    } catch (e) {
        throw new Error('sips 转换失败，请确保是 macOS 系统');
    }

    let currentSize = fs.statSync(outputPath).size;
    let quality = 80;

    console.log(`📊 初始大小: ${(currentSize / 1024).toFixed(2)} KB`);

    // 如果太大，降低质量
    while (currentSize > targetSizeKB * 1024 && quality > 10) {
        quality -= 10;
        execSync(`sips -s formatOptions ${quality} "${outputPath}"`, { stdio: 'ignore' });
        currentSize = fs.statSync(outputPath).size;
        console.log(`🔄 降质到 ${quality}: ${(currentSize / 1024).toFixed(2)} KB`);
    }

    // 如果还是太大，缩小尺寸 (每次缩小 10%)
    while (currentSize > targetSizeKB * 1024) {
        const widthOutput = execSync(`sips -g pixelWidth "${outputPath}"`, { encoding: 'utf8' });
        const currentWidth = parseInt(widthOutput.match(/pixelWidth: (\d+)/)[1]);

        if (currentWidth < 300) break; // 最小宽度保护

        const newWidth = Math.floor(currentWidth * 0.9);
        execSync(`sips -Z ${newWidth} "${outputPath}"`, { stdio: 'ignore' });

        currentSize = fs.statSync(outputPath).size;
        console.log(`📐 缩放至宽 ${newWidth}: ${(currentSize / 1024).toFixed(2)} KB`);
    }

    // 获取最终尺寸
    const finalWidthOutput = execSync(`sips -g pixelWidth "${outputPath}"`, { encoding: 'utf8' });
    const finalHeightOutput = execSync(`sips -g pixelHeight "${outputPath}"`, { encoding: 'utf8' });
    const finalWidth = parseInt(finalWidthOutput.match(/pixelWidth: (\d+)/)[1]);
    const finalHeight = parseInt(finalHeightOutput.match(/pixelHeight: (\d+)/)[1]);

    return { finalWidth, finalHeight, quality };
}

function main() {
    const args = process.argv.slice(2);

    if (args.length === 0) {
        console.log('用法: node compress_image.js <图片名称> [目标大小KB]');
        console.log('');
        console.log('示例:');
        console.log('  node compress_image.js example.png      # 压缩到默认 400KB');
        console.log('  node compress_image.js example.jpg 200  # 压缩到 200KB');
        console.log('');
        console.log('说明:');
        console.log('  - 图片名称是 images 目录下的文件名');
        console.log('  - 输出会覆盖原文件（转为 jpg 格式）');
        process.exit(1);
    }

    const imageName = args[0];
    const targetSizeKB = parseInt(args[1]) || 400;

    // 构建图片路径
    const imagesDir = path.join(__dirname, '..', 'images');
    const inputPath = path.join(imagesDir, imageName);

    // 检查文件是否存在
    if (!fs.existsSync(inputPath)) {
        console.error(`❌ 错误: 文件不存在 - ${inputPath}`);
        console.log('');
        console.log('📂 images 目录下的文件:');
        try {
            const files = fs.readdirSync(imagesDir);
            files.forEach(f => console.log(`   - ${f}`));
        } catch (e) {
            console.log('   (images 目录不存在)');
        }
        process.exit(1);
    }

    // 获取不带扩展名的文件名
    const baseName = path.basename(imageName, path.extname(imageName));
    const outputPath = path.join(imagesDir, `${baseName}.jpg`);

    // 记录原始大小
    const originalSize = fs.statSync(inputPath).size;
    console.log(`\n🚀 开始压缩... 文件: ${imageName}`);
    console.log(`📦 原始大小: ${(originalSize / 1024).toFixed(2)} KB`);
    console.log(`🎯 目标大小: ${targetSizeKB} KB`);
    console.log('');

    try {
        // 如果输入和输出不同，先复制一份临时文件
        let tempPath = inputPath;
        const needTemp = inputPath !== outputPath;
        if (needTemp) {
            tempPath = path.join(__dirname, '.temp_compress');
            fs.copyFileSync(inputPath, tempPath);
        }

        // 压缩
        console.log('🗜️  压缩中 (使用 macOS sips)...');
        const result = compressImageWithSips(tempPath, outputPath, targetSizeKB);

        // 清理临时文件
        if (needTemp && fs.existsSync(tempPath)) {
            fs.unlinkSync(tempPath);
        }

        // 如果原文件不是 jpg，删除原文件
        if (inputPath !== outputPath && fs.existsSync(inputPath)) {
            fs.unlinkSync(inputPath);
            console.log(`🗑️  已删除原文件: ${imageName}`);
        }

        // 结果
        const finalSize = fs.statSync(outputPath).size;
        const compressionRatio = ((1 - finalSize / originalSize) * 100).toFixed(1);

        console.log('');
        console.log('═'.repeat(40));
        console.log(`✅ 压缩完成!`);
        console.log(`   文件: images/${baseName}.jpg`);
        console.log(`   尺寸: ${result.finalWidth} x ${result.finalHeight}`);
        console.log(`   大小: ${(finalSize / 1024).toFixed(2)} KB`);
        console.log(`   压缩率: ${compressionRatio}%`);
        console.log('═'.repeat(40));

        // 复制 CDN URL 到剪贴板
        const cdnUrl = `https://cdn.jsdelivr.net/gh/InvisibleQAQ/gpt-image-2-prompt-quicker@main/images/${baseName}.jpg`;
        console.log(`\n📋 CDN: ${cdnUrl}`);

        try {
            execSync(`echo "${cdnUrl}" | pbcopy`);
            console.log('✨ 已复制到剪贴板');
        } catch (e) { }

    } catch (error) {
        console.error('\n❌ 错误:', error.message);
        process.exit(1);
    }
}

main();
