using System.IO;
using System.Windows;
using Microsoft.Web.WebView2.Core;

namespace Masbah.Desktop;

public partial class MainWindow : Window
{
    public MainWindow()
    {
        InitializeComponent();
        Loaded += OnLoaded;
    }

    private async void OnLoaded(object sender, RoutedEventArgs e)
    {
        var appData = Environment.GetFolderPath(Environment.SpecialFolder.LocalApplicationData);
        var userDataFolder = Path.Combine(appData, "Masbah", "WebView2");
        Directory.CreateDirectory(userDataFolder);

        var environment = await CoreWebView2Environment.CreateAsync(userDataFolder: userDataFolder);
        await AppWebView.EnsureCoreWebView2Async(environment);

        AppWebView.CoreWebView2.Settings.AreDevToolsEnabled = false;
        AppWebView.CoreWebView2.Settings.AreDefaultContextMenusEnabled = false;

        var indexPath = Path.Combine(AppContext.BaseDirectory, "wwwroot", "index.html");
        if (!File.Exists(indexPath))
        {
            MessageBox.Show(
                "Desktop app files are missing. Please rebuild the application.",
                "Masbah",
                MessageBoxButton.OK,
                MessageBoxImage.Error);
            Close();
            return;
        }

        AppWebView.Source = new Uri(indexPath);
    }
}
