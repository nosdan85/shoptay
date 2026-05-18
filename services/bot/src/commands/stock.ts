import { SlashCommandBuilder, ChatInputCommandInteraction } from 'discord.js';
import axios from 'axios';
import { config } from '../config';

export const stockCommand = {
  data: new SlashCommandBuilder()
    .setName('stock')
    .setDescription('Check product availability')
    .addStringOption((opt) =>
      opt.setName('product').setDescription('Product name to search').setRequired(false)
    ),

  async execute(interaction: ChatInputCommandInteraction): Promise<void> {
    await interaction.deferReply();

    const productSearch = interaction.options.getString('product');

    try {
      const response = await axios.get(`${config.apiBaseUrl}/shop/products`, {
        timeout: 10000,
      });

      const products = response.data.products || response.data || [];

      let filteredProducts = products;
      if (productSearch) {
        const searchLower = productSearch.toLowerCase();
        filteredProducts = products.filter((p: any) =>
          p.name.toLowerCase().includes(searchLower) ||
          p.category?.toLowerCase().includes(searchLower)
        );
      }

      if (filteredProducts.length === 0) {
        await interaction.editReply({
          content: productSearch
            ? `No products found matching "${productSearch}"`
            : 'No products available at the moment.',
        });
        return;
      }

      // Show first 10 products
      const displayProducts = filteredProducts.slice(0, 10);

      const embed = {
        color: 0x5865F2,
        title: productSearch ? `Search Results: "${productSearch}"` : 'Available Products',
        description: displayProducts
          .map((p: any) => {
            const inStock = p.inStock !== false && p.stock !== 0;
            const stockIndicator = inStock ? '✅' : '❌';
            return `${stockIndicator} **${p.name}** - $${p.price?.toFixed(2) || '0.00'}`;
          })
          .join('\n'),
        footer: {
          text: filteredProducts.length > 10
            ? `Showing 10 of ${filteredProducts.length} products`
            : `${filteredProducts.length} products found`,
        },
        timestamp: new Date().toISOString(),
      };

      await interaction.editReply({ embeds: [embed] });
    } catch (error: any) {
      console.error('[Stock] Error:', error);
      await interaction.editReply({
        content: 'Failed to fetch products.',
      });
    }
  },
};
