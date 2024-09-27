"use client";
import React, { useState, useEffect } from 'react';
import { TextInput, Button, Switch, Group, Modal } from '@mantine/core';
import emailjs from '@emailjs/browser';
import toast, { Toaster } from 'react-hot-toast';
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';
import { ChattApp, Merchendise, ioUSDCondract } from '@/const/contracts';
import { ADDRESS_ZERO, prepareContractCall, PreparedTransaction, resolveMethod } from 'thirdweb';
import { MediaRenderer, TransactionButton, useActiveAccount, useReadContract } from 'thirdweb/react';
import { allowance } from 'thirdweb/extensions/erc20';
import ApprovalButtonERC20Currency from '../components/Merchandise/approveButton';
import { useBasket } from '@/Hooks/BusketProvider';
import client from '@/lib/client';

type CustomerDetails = {
  name: string;
  email: string;
  street: string;
  postcode: string;
  city: string;
  country: string;
  companyName?: string;
  vatNumber?: string;
};

type CompanyDetails = {
  name: string;
  address: string;
  email: string;
  phone: string;
  vatNumber: string;
};

type Product = {
  tokenId: bigint;
  product: string;
  price: number;
  size: string;
  quantity: number;
  image: string;
  allowlistProof: {
    proof: string[];
    quantityLimitPerWallet: string;
    pricePerToken: string;
    currency: string;
  };
  data: string;
};

type InvoiceDetails = {
  invoiceId: string;
  date: string;
  companyDetails: CompanyDetails;
  customerDetails: CustomerDetails;
  products: Product[];
  taxRate: number;
};

const BasketModal: React.FC<{ isOpen: boolean; onClose: () => void }> = ({ isOpen, onClose }) => {
  const [isCompany, setIsCompany] = useState(false);
  const [customerDetails, setCustomerDetails] = useState<CustomerDetails>({
    name: '',
    email: '',
    street: '',
    postcode: '',
    city: '',
    country: ''
  });
  const [companyDetails, setCompanyDetails] = useState<CompanyDetails>({
    name: 'ioPlasmaVerse',
    address: 'Habichtstr.6, 46399 Bocholt, Germany',
    email: 'ioPlasmaVerse@gmail.com',
    phone: '+4915120249199',
    vatNumber: 'VAT123456789'
  });

  const account = useActiveAccount();
  const { basket, removeProductFromBasket, updateProductQuantity } = useBasket();
  const [taxRate] = useState(0.1); // Assuming a 10% tax rate
  const [previewInvoice, setPreviewInvoice] = useState(false);
  const [invoiceCount, setInvoiceCount] = useState(1);
  const [invoiceDetails, setInvoiceDetails] = useState<InvoiceDetails | null>(null);
  const [isTokenApproved, setIsTokenApproved] = useState(false);

  const createInvoiceMessage = (invoiceDetails: InvoiceDetails) => {
    const productValue = invoiceDetails.products.reduce((total, product) => total + (product.price * product.quantity) / (1 + invoiceDetails.taxRate), 0);
    const taxAmount = productValue * invoiceDetails.taxRate;
    const totalPrice = productValue + taxAmount;

    return `
      <div style="font-family: Arial, sans-serif; margin: 20px; position: relative; height: 297mm; padding-bottom: 100px; box-sizing: border-box;" id="invoice-content">
        <div style="display: flex; justify-content: space-between; align-items: center;">
          <img src="/ioPlasmaVerse.png" alt="ioPlasmaVerse Logo" style="height: 120px;">
          <div style="text-align: right;">
            <h4>Invoice ID: ${invoiceDetails.invoiceId}</h4>
            <p><strong>Date:</strong> ${invoiceDetails.date}</p>
          </div>
        </div>
        <div style="text-align: center; margin: 20px 0; padding-top: 15px;">
          <h2>${invoiceDetails.companyDetails.name}</h2>
          <p>${invoiceDetails.companyDetails.address}</p>
          <p>Email: ${invoiceDetails.companyDetails.email}</p>
          <p>Phone: ${invoiceDetails.companyDetails.phone}</p>
          <p>VAT Number: ${invoiceDetails.companyDetails.vatNumber}</p>
        </div>
        <div style="padding-top: 45px;">
          <h3>Customer Details</h3>
        </div>
        <div style="padding-top: 9px;">
          <p><strong>Name:</strong> ${invoiceDetails.customerDetails.name}</p>
          <p><strong>Email:</strong> ${invoiceDetails.customerDetails.email}</p>
          <p><strong>Address:</strong> ${invoiceDetails.customerDetails.street}, ${invoiceDetails.customerDetails.postcode}, ${invoiceDetails.customerDetails.city}, ${invoiceDetails.customerDetails.country}</p>
          ${invoiceDetails.customerDetails.companyName ? `<p><strong>Company Name:</strong> ${invoiceDetails.customerDetails.companyName}</p>` : ''}
          ${invoiceDetails.customerDetails.vatNumber ? `<p><strong>VAT Number:</strong> ${invoiceDetails.customerDetails.vatNumber}</p>` : ''}
        </div>
        <div style="padding-top: 45px;">
          <h3>Order Details</h3>
        </div>
        <div style="padding-top: 9px;">
          <table style="width: 100%; border-collapse: collapse;">
            <tr>
              <th style="border: 1px solid #ddd; padding: 8px;">Description</th>
              <th style="border: 1px solid #ddd; padding: 8px;">Size</th>
              <th style="border: 1px solid #ddd; padding: 8px;">Quantity</th>
              <th style="border: 1px solid #ddd; padding: 8px;">Price</th>
              <th style="border: 1px solid #ddd; padding: 8px;">Total</th>
            </tr>
            ${invoiceDetails.products.map(product => `
              <tr>
                <td style="border: 1px solid #ddd; padding: 8px;">${product.product}</td>
                <td style="border: 1px solid #ddd; padding: 8px;">${product.size}</td>
                <td style="border: 1px solid #ddd; padding: 8px;">${product.quantity}</td>
                <td style="border: 1px solid #ddd; padding: 8px;">${product.price} USDC</td>
                <td style="border: 1px solid #ddd; padding: 8px;">${(product.price * product.quantity).toFixed(2)} USDC</td>
              </tr>
            `).join('')}
          </table>
        </div>
        <div style="background: white; border-top: 1px solid #ddd; padding-top: 45px;">
          <h3>Summary</h3>
          <p><strong>Product Value:</strong> ${productValue.toFixed(2)} USDC</p>
          <p><strong>Tax (${invoiceDetails.taxRate * 100}%):</strong> ${taxAmount.toFixed(2)} USDC</p>
          <p><strong>Total Price:</strong> ${totalPrice.toFixed(2)} USDC</p>
        </div>
      </div>
    `;
  };

  const generatePdf = async (invoiceDetails: InvoiceDetails) => {
    const invoiceElement = document.getElementById('invoice-content');
    if (!invoiceElement) {
      toast.error('Invoice content not found!');
      return;
    }
    const canvas = await html2canvas(invoiceElement, { scale: 2 });
    const imgData = canvas.toDataURL('image/jpeg', 0.5); // Reduce image quality to 50%
    const pdf = new jsPDF('p', 'mm', 'a4');
    const imgProps = pdf.getImageProperties(imgData);
    const pdfWidth = pdf.internal.pageSize.getWidth();
    const pdfHeight = (imgProps.height * pdfWidth) / imgProps.width;

    pdf.addImage(imgData, 'JPEG', 0, 0, pdfWidth, pdfHeight);

    return pdf.output('datauristring');
  };

  useEffect(() => {
    fetch('/api/fetchInvoice')
      .then((response) => response.json())
      .then((data) => setInvoiceCount(data.count))
      .catch((error) => console.error('Error fetching invoice count:', error));
  }, []);

  const generateInvoiceId = () => {
    const newCount = invoiceCount + 1;
    fetch('/api/saveInvoice', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ count: newCount })
    }).then(() => setInvoiceCount(newCount));
    return `INV-${newCount.toString().padStart(6, '0')}`;
  };

  const sendInvoiceEmail = async () => {
    const invoiceId = generateInvoiceId();
    const newInvoiceDetails: InvoiceDetails = {
      invoiceId,
      date: new Date().toLocaleDateString(),
      companyDetails,
      customerDetails,
      products: basket,
      taxRate
    };
    const pdfDataUri = await generatePdf(newInvoiceDetails);
    setInvoiceDetails(newInvoiceDetails);

    const emailData = {
      user_name: customerDetails.name,
      user_email: customerDetails.email,
      invoice_attachment: pdfDataUri,
    };

    emailjs.send('service_1jiz9i6', 'template_6p61wr3', emailData, 'VsLVOvhz5fGcJloza')
      .then((response) => {
        console.log('SUCCESS!', response.status, response.text);
        toast.success('Invoice sent successfully!');
      }, (error) => {
        console.log('FAILED...', error);
        toast.error('Failed to send invoice.');
      });
  };

  const isFormValid = () => {
    return customerDetails.name && customerDetails.email && customerDetails.street && customerDetails.postcode && customerDetails.city && customerDetails.country;
  };

  const address = Merchendise.address as `0x${string}`;

  const { data: ERC20ApprovalData } = useReadContract(allowance, {
    contract: ioUSDCondract,
    owner: account?.address || ADDRESS_ZERO,
    spender: address,
  });

  useEffect(() => {
    if (ERC20ApprovalData && account) {
      setIsTokenApproved(BigInt(ERC20ApprovalData) >= basket.reduce((total, product) => total + BigInt(product.price * product.quantity), BigInt(0)));
    }
  }, [ERC20ApprovalData, account, basket]);

  const prepareTransaction = async (): Promise<PreparedTransaction<any>> => {
    const _receiver = account?.address;
    const _tokenIds = basket.map(product => product.tokenId);
    const _quantities = basket.map(product => product.quantity);
    const _currency = basket[0].allowlistProof.currency; // Ensure the same currency is used
    const _pricePerTokens = basket.map(product => BigInt(product.price));
    const _allowlistProofs = basket.map(product => ({
      proof: product.allowlistProof.proof,
      quantityLimitPerWallet: BigInt(product.allowlistProof.quantityLimitPerWallet),
      pricePerToken: BigInt(product.allowlistProof.pricePerToken),
      currency: product.allowlistProof.currency
    }));
    const _datas = basket.map(product => product.data);

    const resolvedMethod = await resolveMethod("claimBatch");
    const transaction = await prepareContractCall({
      contract: Merchendise,
      method: resolvedMethod,
      params: [_receiver, _tokenIds, _quantities, _currency, _pricePerTokens, _allowlistProofs, _datas],
    });
    return transaction;
  };

  const handleTransactionSent = () => {
    console.log("Transaction sent");
  };

  const handleTransactionConfirmed = () => {
    sendInvoiceEmail();
    console.log("Transaction confirmed");
  };

  const handleTransactionError = (error: Error) => {
    console.error(error);
  };

  return (
    <Modal opened={isOpen} onClose={onClose} title="Basket">
      <div style={{ padding: '20px' }}>
      <div className="basket-items">
          <h2>Basket Items</h2>
          {basket.map((product, index) => (
            <div key={index} className="basket-item">
                        <MediaRenderer src={product.image} client={client} className="w-full h-52 object-cover rounded-md" />

              <div>
                <p>{product.product}</p>
                <p>Size: {product.size}</p>
                <p>Price: {product.price} USDC</p>
                <TextInput
                  type="number"
                  label="Quantity"
                  value={product.quantity}
                  onChange={(e) => updateProductQuantity(product.tokenId, product.size, parseInt(e.currentTarget.value))}
                />
                <Button onClick={() => removeProductFromBasket(product.tokenId, product.size)}>Remove</Button>
              </div>
            </div>
          ))}
        </div>
        <Toaster />
        <Group position="apart" style={{ marginBottom: '20px' }}>
          <span>Are you a company?</span>
          <Switch checked={isCompany} onChange={(event) => setIsCompany(event.currentTarget.checked)} />
        </Group>
        <TextInput
          label="Name"
          name="user_name"
          placeholder="Your Name"
          value={customerDetails.name}
          onChange={(e) => setCustomerDetails({ ...customerDetails, name: e.currentTarget.value })}
          required
        />
        <TextInput
          label="Email"
          type="email"
          name="user_email"
          placeholder="Your Email"
          value={customerDetails.email}
          onChange={(e) => setCustomerDetails({ ...customerDetails, email: e.currentTarget.value })}
          required
        />
        <TextInput
          label="Street"
          name="user_street"
          placeholder="Street Address"
          value={customerDetails.street}
          onChange={(e) => setCustomerDetails({ ...customerDetails, street: e.currentTarget.value })}
          required
        />
        <TextInput
          label="Postcode"
          name="user_postcode"
          placeholder="Postcode"
          value={customerDetails.postcode}
          onChange={(e) => setCustomerDetails({ ...customerDetails, postcode: e.currentTarget.value })}
          required
        />
        <TextInput
          label="City"
          name="user_city"
          placeholder="City"
          value={customerDetails.city}
          onChange={(e) => setCustomerDetails({ ...customerDetails, city: e.currentTarget.value })}
          required
        />
        <TextInput
          label="Country"
          name="user_country"
          placeholder="Country"
          value={customerDetails.country}
          onChange={(e) => setCustomerDetails({ ...customerDetails, country: e.currentTarget.value })}
          required
        />
        {isCompany && (
          <>
            <TextInput
              label="Company Name"
              name="company_name"
              placeholder="Company Name"
              value={customerDetails.companyName || ''}
              onChange={(e) => setCustomerDetails({ ...customerDetails, companyName: e.currentTarget.value })}
              required
            />
            <TextInput
              label="VAT Number"
              name="vat_number"
              placeholder="VAT Number"
              value={customerDetails.vatNumber || ''}
              onChange={(e) => setCustomerDetails({ ...customerDetails, vatNumber: e.currentTarget.value })}
              required
            />
          </>
        )}

        <Button onClick={() => setPreviewInvoice(!previewInvoice)} style={{ marginTop: '20px' }}>
          {previewInvoice ? 'Hide Invoice' : 'Preview Invoice'}
        </Button>
        {previewInvoice && (
          <div className="invoice-preview" id="invoice-content" dangerouslySetInnerHTML={{ __html: createInvoiceMessage({
            invoiceId: 'PREVIEW',
            date: new Date().toLocaleDateString(),
            companyDetails,
            customerDetails,
            products: basket,
            taxRate
          }) }} />
        )}
        <Button onClick={() => generatePdf({
          invoiceId: 'PREVIEW',
          date: new Date().toLocaleDateString(),
          companyDetails,
          customerDetails,
          products: basket,
          taxRate
        })} style={{ marginTop: '20px' }}>
          Save as PDF
        </Button>
        <Button onClick={sendInvoiceEmail} disabled={!isFormValid()} style={{ marginTop: '20px' }}>
          Send Invoice
        </Button>
        <div className="mt-4">
          {!isTokenApproved && (
            <ApprovalButtonERC20Currency amount={basket.reduce((total, product) => total + (product.price * product.quantity), 0).toString()} />
          )}
          {isTokenApproved && account && (
            <TransactionButton
              transaction={prepareTransaction}
              disabled={!isFormValid()}
              onTransactionSent={handleTransactionSent}
              onTransactionConfirmed={handleTransactionConfirmed}
              onError={handleTransactionError}
            >
              Buy Merchandise (${basket.reduce((total, product) => total + (product.price * product.quantity), 0)} USDC)
            </TransactionButton>
          )}
        </div>
        
        <style jsx>{`
          .invoice-preview {
            width: 210mm;
            min-height: 297mm;
            padding: 20mm;
            margin: 10mm auto;
            background: white;
            color: black;
            border: 1px solid #ddd;
            box-shadow: 0 0 10px rgba(0, 0, 0, 0.1);
          }

          @media (max-width: 768px) {
            .invoice-preview {
              width: 100%;
              padding: 10mm;
              margin: 5mm auto;
            }
          }

          .basket-items {
            margin-top: 20px;
          }

          .basket-item {
            display: flex;
            align-items: center;
            margin-bottom: 10px;
          }
        `}</style>
      </div>
    </Modal>
  );
};

export default BasketModal;
