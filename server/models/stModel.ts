import { getProdPool as pool } from '../config/database.js';

const getAllSaleTransactions = async () => {
  try {
    const query = `
      SELECT * FROM sale_transactions
      ORDER BY created_at DESC
      LIMIT $1
    `;
    const limit = 20;
    const result = await pool().query(query, [limit]);
    return result.rows;
  } catch (error) {
    console.error('Error fetching sales transactions:', error);
    throw new Error('Error fetching sales transactions');
  }
};

const getInvoiceList = async (
  filter,
  searchQuery,
  memberSearchQuery,
  sortField,
  sortDirection,
  page = 1,
  limit = 10,
  outlet_id
) => {
  try {
    let whereClause = {
      outlet_id: BigInt(outlet_id)
    };

    // Handle invoice type filter
    if (filter) {
      switch (filter.toLowerCase()) {
        case 'package':
          whereClause.cs_invoice_items = {
            some: {
              member_care_package_id: { not: null }
            }
          };
          break;
        case 'service':
          whereClause.cs_invoice_items = {
            some: {
              AND: [
                { member_care_package_id: null },
                { service_name: { not: null } }
              ]
            }
          };
          break;
        case 'product':
          whereClause.cs_invoice_items = {
            some: {
              AND: [
                { member_care_package_id: null },
                { product_name: { not: null } }
              ]
            }
          };
          break;
      }
    }

    // Handle search queries
    if (searchQuery) {
      whereClause.manual_invoice_no = {
        contains: searchQuery,
        mode: 'insensitive'
      };
    }

    if (memberSearchQuery) {
      whereClause.cs_members = {
        member_name: {
          contains: memberSearchQuery,
          mode: 'insensitive'
        }
      };
    }

    // Handle sorting
    let orderBy = {};
    switch (sortField) {
      case 'invoice_id':
        orderBy.invoice_id = sortDirection;
        break;
      case 'manual_invoice_no':
        orderBy.manual_invoice_no = sortDirection;
        break;
      case 'member_name':
        orderBy.cs_members = { member_name: sortDirection };
        break;
      case 'total_amount':
        orderBy.total_invoice_amount = sortDirection;
        break;
      case 'date':
        orderBy.invoice_created_at = sortDirection;
        break;
      case 'outstanding':
        orderBy.outstanding_total_payment_amount = sortDirection;
        break;
      default:
        orderBy.invoice_id = 'desc';
    }

    // Get total count
    const totalItems = await prisma.cs_invoices.count({
      where: whereClause
    });

    // Calculate pagination
    const skip = (page - 1) * limit;
    const totalPages = Math.ceil(totalItems / limit);

    // Fetch invoices
    const invoices = await prisma.cs_invoices.findMany({
      where: whereClause,
      skip,
      take: limit,
      orderBy,
      include: {
        cs_invoice_items: true,
        cs_status: true,
        cs_members: true,
        cs_invoice_payment: true
      }
    });

    // Transform the data (keep existing transformation logic)
    const transformedInvoices = await Promise.all(invoices.map(async (invoice) => {
      const payments = await prisma.cs_invoice_payment.findMany({
        where: { invoice_id: invoice.invoice_id },
        include: {
          cs_payment_method: true
        }
      });

      // Check for different types of items
      const hasServices = invoice.cs_invoice_items.some(item =>
        item.service_name !== null && item.member_care_package_id === null
      );
      const hasProducts = invoice.cs_invoice_items.some(item =>
        item.product_name !== null && item.member_care_package_id === null
      );
      const hasCarePackages = invoice.cs_invoice_items.some(item =>
        item.member_care_package_id !== null
      );

      // Calculate total paid
      const totalPaid = payments.reduce(
        (sum, payment) => sum + Number(payment.invoice_payment_amount || 0),
        0
      );

      return serializeBigInt({
        invoice_id: invoice.invoice_id,
        manual_invoice_no: invoice.manual_invoice_no,
        customer_type: invoice.customer_type,
        total_invoice_amount: parseFloat(invoice.total_invoice_amount || '0'),
        total_paid_amount: parseFloat(invoice.total_paid_amount || '0'),
        outstanding_total_payment_amount: parseFloat(invoice.outstanding_total_payment_amount),
        invoice_status: invoice.cs_status?.status_name || 'Unknown',
        invoice_created_at: invoice.invoice_created_at,
        has_services: hasServices,
        has_products: hasProducts,
        has_care_packages: hasCarePackages,
        member: invoice.cs_members ? {
          id: invoice.cs_members.member_id,
          name: invoice.cs_members.member_name,
          email: invoice.cs_members.member_email,
          contact: invoice.cs_members.member_contact
        } : null,
        payments: payments.map(payment => ({
          amount: parseFloat(payment.invoice_payment_amount),
          payment_method: payment.cs_payment_method?.payment_method_name
        }))
      });
    }));

    return {
      items: transformedInvoices,
      total: totalItems,
      totalPages,
      currentPage: page
    };

  } catch (error) {
    console.error('Error in getInvoiceList:', error);
    throw new Error('Failed to fetch invoice list');
  }
};

const getInvoiceById = async (id) => {
  try {
    const invoice = await prisma.cs_invoices.findUnique({
      where: {
        invoice_id: BigInt(id)
      },
      include: {
        cs_invoice_items: true,
        cs_status: true,
        cs_members: true,
        cs_employees: true, // Invoice handler
        // Join invoice payments
        cs_invoice_payment: {
          include: {
            cs_payment_method: true,
            // Include employee info for created_by and updated_by
            cs_employees_cs_invoice_payment_invoice_payment_created_byTocs_employees: {
              select: {
                employee_code: true,
                employee_name: true
              }
            },
            cs_employees_cs_invoice_payment_invoice_payment_updated_byTocs_employees: {
              select: {
                employee_code: true,
                employee_name: true
              }
            }
          }
        }
      }
    });

    if (!invoice) {
      return null;
    }

    // Serialize the data first to handle BigInts
    const serializedInvoice = serializeBigInt(invoice);

    // Transform the invoice data
    const transformedInvoice = {
      invoice_id: serializedInvoice.invoice_id,
      manual_invoice_no: serializedInvoice.manual_invoice_no,
      customer_type: serializedInvoice.customer_type,
      total_invoice_amount: parseFloat(serializedInvoice.total_invoice_amount || '0'),
      total_paid_amount: parseFloat(serializedInvoice.total_paid_amount || '0'),
      outstanding_total_payment_amount: parseFloat(serializedInvoice.outstanding_total_payment_amount || '0'),
      invoice_status: serializedInvoice.cs_status?.status_name || 'Unknown',
      invoice_created_at: serializedInvoice.invoice_created_at,
      invoice_remark: serializedInvoice.remarks,

      // Member information
      member: serializedInvoice.cs_members ? {
        id: serializedInvoice.cs_members.member_id,
        name: serializedInvoice.cs_members.member_name,
        email: serializedInvoice.cs_members.member_email,
        contact: serializedInvoice.cs_members.member_contact
      } : null,

      // Handler information
      handler: serializedInvoice.cs_employees ? {
        code: serializedInvoice.cs_employees.employee_code,
        name: serializedInvoice.cs_employees.employee_name
      } : null,

      // Payment information
      payments: serializedInvoice.cs_invoice_payment.map(payment => ({
        id: payment.invoice_payment_id,
        amount: parseFloat(payment.invoice_payment_amount || '0'),
        payment_method: payment.cs_payment_method?.payment_method_name,
        created_at: payment.invoice_payment_created_at,
        updated_at: payment.invoice_payment_updated_at,
        remarks: payment.remarks,
        created_by: {
          code: payment.cs_employees_cs_invoice_payment_invoice_payment_created_byTocs_employees?.employee_code,
          name: payment.cs_employees_cs_invoice_payment_invoice_payment_created_byTocs_employees?.employee_name
        },
        updated_by: {
          code: payment.cs_employees_cs_invoice_payment_invoice_payment_updated_byTocs_employees?.employee_code,
          name: payment.cs_employees_cs_invoice_payment_invoice_payment_updated_byTocs_employees?.employee_name
        }
      })),

      // Items information
      items: serializedInvoice.cs_invoice_items.map(item => ({
        id: item.invoice_item_id,
        service_name: item.service_name,
        product_name: item.product_name,
        member_care_package_id: item.member_care_package_id,
        original_unit_price: parseFloat(item.original_unit_price || '0'),
        custom_unit_price: parseFloat(item.custom_unit_price || '0'),
        discount_percentage: parseFloat(item.discount_percentage || '0'),
        quantity: item.quantity,
        remarks: item.remarks,
        amount: parseFloat(item.amount || '0'),
        item_type: item.item_type
      }))
    };

    return transformedInvoice;
  } catch (error) {
    console.error('Error in getInvoiceById:', error);
    throw new Error('Failed to fetch invoice');
  }
};


export default {
  getAllSaleTransactions,
};
