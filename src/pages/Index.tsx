
import React, { useState, useEffect } from 'react';
import { Search, Plus, Copy, Edit2, Trash2, ChevronLeft, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { useToast } from '@/hooks/use-toast';

interface Prompt {
  id: string;
  title: string;
  content: string;
  createdAt?: any;
  updatedAt?: any;
}

const PROMPTS_PER_PAGE = 10;
const PASSWORD = "300695";

const Index = () => {
  const [prompts, setPrompts] = useState<Prompt[]>([]);
  const [filteredPrompts, setFilteredPrompts] = useState<Prompt[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingPrompt, setEditingPrompt] = useState<Prompt | null>(null);
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isPasswordVerified, setIsPasswordVerified] = useState(false);
  
  const { toast } = useToast();

  // Mock data - In real implementation, this would connect to Firebase
  useEffect(() => {
    // Simulate loading
    setTimeout(() => {
      const mockPrompts: Prompt[] = [
        {
          id: '1',
          title: 'Creative Writing Assistant',
          content: 'Help me write a compelling story about a character who discovers they have the ability to...',
          createdAt: new Date()
        },
        {
          id: '2', 
          title: 'Code Review Helper',
          content: 'Please review this code for best practices, potential bugs, and optimization opportunities...',
          createdAt: new Date()
        },
        {
          id: '3',
          title: 'Email Marketing Template',
          content: 'Create a professional email template for a product launch announcement that includes...',
          createdAt: new Date()
        }
      ];
      setPrompts(mockPrompts);
      setFilteredPrompts(mockPrompts);
      setIsLoading(false);
    }, 1000);
  }, []);

  // Search functionality
  useEffect(() => {
    if (searchQuery.trim() === '') {
      setFilteredPrompts(prompts);
    } else {
      const filtered = prompts.filter(prompt =>
        prompt.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        prompt.content.toLowerCase().includes(searchQuery.toLowerCase())
      );
      setFilteredPrompts(filtered);
    }
    setCurrentPage(1);
  }, [searchQuery, prompts]);

  const checkPassword = (action: string): boolean => {
    if (isPasswordVerified) return true;
    
    const enteredPassword = prompt(`Masukkan password untuk ${action}:`);
    if (enteredPassword === PASSWORD) {
      setIsPasswordVerified(true);
      return true;
    } else if (enteredPassword !== null) {
      toast({
        title: "Password salah!",
        description: "Silakan coba lagi.",
        variant: "destructive"
      });
    }
    return false;
  };

  const openModal = (prompt?: Prompt) => {
    const action = prompt ? 'mengedit prompt' : 'menambah prompt baru';
    if (!checkPassword(action)) return;

    setEditingPrompt(prompt || null);
    setTitle(prompt?.title || '');
    setContent(prompt?.content || '');
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setEditingPrompt(null);
    setTitle('');
    setContent('');
  };

  const savePrompt = () => {
    if (!title.trim() || !content.trim()) {
      toast({
        title: "Error",
        description: "Judul dan isi prompt tidak boleh kosong.",
        variant: "destructive"
      });
      return;
    }

    const newPrompt: Prompt = {
      id: editingPrompt?.id || Date.now().toString(),
      title: title.trim(),
      content: content.trim(),
      createdAt: editingPrompt?.createdAt || new Date(),
      updatedAt: new Date()
    };

    if (editingPrompt) {
      setPrompts(prev => prev.map(p => p.id === editingPrompt.id ? newPrompt : p));
      toast({
        title: "Berhasil",
        description: "Prompt berhasil diperbarui."
      });
    } else {
      setPrompts(prev => [newPrompt, ...prev]);
      toast({
        title: "Berhasil", 
        description: "Prompt berhasil ditambahkan."
      });
    }

    closeModal();
  };

  const deletePrompt = (id: string, title: string) => {
    if (!checkPassword(`menghapus prompt "${title}"`)) return;

    setPrompts(prev => prev.filter(p => p.id !== id));
    toast({
      title: "Berhasil",
      description: "Prompt berhasil dihapus."
    });
  };

  const copyToClipboard = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      toast({
        title: "Berhasil",
        description: "Prompt berhasil disalin ke clipboard."
      });
    } catch (err) {
      toast({
        title: "Error",
        description: "Gagal menyalin prompt.",
        variant: "destructive"
      });
    }
  };

  // Pagination
  const totalPages = Math.ceil(filteredPrompts.length / PROMPTS_PER_PAGE);
  const startIndex = (currentPage - 1) * PROMPTS_PER_PAGE;
  const currentPrompts = filteredPrompts.slice(startIndex, startIndex + PROMPTS_PER_PAGE);

  const renderPagination = () => {
    if (totalPages <= 1) return null;

    const pages = [];
    const maxVisiblePages = 5;
    let startPage = Math.max(1, currentPage - Math.floor(maxVisiblePages / 2));
    let endPage = Math.min(totalPages, startPage + maxVisiblePages - 1);

    if (endPage - startPage + 1 < maxVisiblePages) {
      startPage = Math.max(1, endPage - maxVisiblePages + 1);
    }

    // Previous button
    pages.push(
      <Button
        key="prev"
        variant="outline"
        size="sm"
        onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
        disabled={currentPage === 1}
        className="min-w-[40px] h-10"
      >
        <ChevronLeft className="w-4 h-4" />
      </Button>
    );

    // First page
    if (startPage > 1) {
      pages.push(
        <Button
          key={1}
          variant={1 === currentPage ? "default" : "outline"}
          size="sm"
          onClick={() => setCurrentPage(1)}
          className="min-w-[40px] h-10"
        >
          1
        </Button>
      );
      if (startPage > 2) {
        pages.push(<span key="ellipsis1" className="px-2">...</span>);
      }
    }

    // Page numbers
    for (let i = startPage; i <= endPage; i++) {
      pages.push(
        <Button
          key={i}
          variant={i === currentPage ? "default" : "outline"}
          size="sm"
          onClick={() => setCurrentPage(i)}
          className="min-w-[40px] h-10"
        >
          {i}
        </Button>
      );
    }

    // Last page
    if (endPage < totalPages) {
      if (endPage < totalPages - 1) {
        pages.push(<span key="ellipsis2" className="px-2">...</span>);
      }
      pages.push(
        <Button
          key={totalPages}
          variant={totalPages === currentPage ? "default" : "outline"}
          size="sm"
          onClick={() => setCurrentPage(totalPages)}
          className="min-w-[40px] h-10"
        >
          {totalPages}
        </Button>
      );
    }

    // Next button
    pages.push(
      <Button
        key="next"
        variant="outline"
        size="sm"
        onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
        disabled={currentPage === totalPages}
        className="min-w-[40px] h-10"
      >
        <ChevronRight className="w-4 h-4" />
      </Button>
    );

    return pages;
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-slate-100 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-slate-600">Memuat prompts...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-100">
      <div className="max-w-4xl mx-auto p-4 md:p-6">
        {/* Header */}
        <div className="bg-white rounded-xl p-6 mb-6 shadow-sm border border-slate-200">
          <div className="text-center mb-6">
            <h1 className="text-2xl md:text-3xl font-semibold text-slate-800 mb-3">
              Prompt Manager
            </h1>
            <p className="text-slate-600 mb-6">
              Kelola koleksi prompt AI Anda dengan mudah
            </p>
            <Button 
              onClick={() => openModal()}
              className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2.5 rounded-lg font-medium transition-colors"
            >
              <Plus className="w-4 h-4 mr-2" />
              Add Prompt
            </Button>
          </div>

          {/* Search */}
          <div className="relative max-w-md mx-auto">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 w-4 h-4" />
            <Input
              type="text"
              placeholder="Cari prompts..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 bg-slate-50 border-slate-200 focus:border-blue-500 focus:ring-blue-500"
            />
          </div>
        </div>

        {/* Prompts Grid */}
        {currentPrompts.length === 0 ? (
          <div className="bg-slate-50 rounded-xl p-12 text-center border border-dashed border-slate-300">
            <p className="text-slate-500">
              {searchQuery ? 'Tidak ada prompt yang ditemukan.' : 'Belum ada prompt tersimpan. Klik "Add Prompt" untuk menambahkan.'}
            </p>
          </div>
        ) : (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
              {currentPrompts.map((prompt) => (
                <div
                  key={prompt.id}
                  className="bg-slate-50 rounded-xl p-5 border border-slate-200 hover:shadow-md transition-shadow flex flex-col h-full"
                >
                  <h3 className="font-semibold text-slate-800 mb-3 text-lg leading-tight">
                    {prompt.title}
                  </h3>
                  <div className="flex-1 overflow-y-auto mb-4 max-h-40">
                    <p className="text-slate-600 text-sm leading-relaxed whitespace-pre-wrap break-words">
                      {prompt.content}
                    </p>
                  </div>
                  <div className="flex justify-end gap-2 mt-auto">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => copyToClipboard(prompt.content)}
                      className="text-slate-500 hover:text-blue-600 hover:bg-blue-50"
                      title="Copy"
                    >
                      <Copy className="w-4 h-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => openModal(prompt)}
                      className="text-slate-500 hover:text-blue-600 hover:bg-blue-50"
                      title="Edit"
                    >
                      <Edit2 className="w-4 h-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => deletePrompt(prompt.id, prompt.title)}
                      className="text-slate-500 hover:text-red-600 hover:bg-red-50"
                      title="Delete"
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex justify-center gap-2 flex-wrap pt-4 pb-6">
                {renderPagination()}
              </div>
            )}
          </>
        )}
      </div>

      {/* Modal */}
      <Dialog open={isModalOpen} onOpenChange={closeModal}>
        <DialogContent className="sm:max-w-[550px] max-h-[90vh] flex flex-col">
          <DialogHeader>
            <DialogTitle className="text-xl font-semibold text-center">
              {editingPrompt ? 'Edit Prompt' : 'Add New Prompt'}
            </DialogTitle>
          </DialogHeader>
          <div className="flex-1 overflow-y-auto px-1">
            <div className="space-y-5">
              <div>
                <Label htmlFor="title" className="text-sm font-medium text-slate-700">
                  Judul
                </Label>
                <Input
                  id="title"
                  type="text"
                  placeholder="Masukkan judul prompt"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="mt-2 bg-slate-50 border-slate-200 focus:border-blue-500 focus:ring-blue-500"
                />
              </div>
              <div>
                <Label htmlFor="content" className="text-sm font-medium text-slate-700">
                  Prompt
                </Label>
                <Textarea
                  id="content"
                  placeholder="Masukkan isi prompt"
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
                  className="mt-2 min-h-[150px] bg-slate-50 border-slate-200 focus:border-blue-500 focus:ring-blue-500 resize-vertical"
                />
              </div>
            </div>
          </div>
          <div className="flex justify-between gap-3 pt-4 border-t border-slate-200 bg-slate-50 -mx-6 px-6 -mb-6 pb-6 rounded-b-lg">
            <Button
              variant="outline"
              onClick={closeModal}
              className="flex-1 border-slate-200 text-slate-600 hover:bg-slate-100"
            >
              Batal
            </Button>
            <Button
              onClick={savePrompt}
              className="flex-1 bg-blue-600 hover:bg-blue-700 text-white"
            >
              Simpan
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Index;
